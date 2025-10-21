import ort from 'onnxruntime-node';
import jimp from 'jimp';

export class CaptchaAI {
  #model;
  #img_sz = 160;
  #maximum_label_sz = 4;

  constructor(model_path) {
    const load_model_promise = ort.InferenceSession.create(model_path);
    return Promise.resolve(load_model_promise)
      .then(session => {
        // NOTE: It is crucial that we use arrow
        // functions here so that we may preserve
        // the `this` context.
        this.#model = session;
        return this;
      });
  }

  async predict(img_url) {
    const img = await this.#getImage(img_url);
    const input = this.#image2Tensor(img);
    const output = await this.#runInference(input);
    const [_, label, box] = this.#NMS(output);

    // order label according x-value
    let index = [];
    for (let i = 0; i < label.length; ++i) {
      index.push(i);
    }
    index.sort((a, b) => box[a * 4] - box[b * 4]);

    // return string
    let result = '';
    for (let i = 0; i < Math.min(index.length, this.#maximum_label_sz); ++i) {
      result += String(label[index[i]]);
    }
    return result;
  }

  #getImage(img_url) {
    return jimp.read(img_url).then(image => {

      // resize image
      if (image.getWidth() > image.getHeight()) {
        image.resize(this.#img_sz, jimp.AUTO);
      } else {
        image.resize(jimp.AUTO, this.#img_sz);
      }

      // add padding
      let bg_image = new jimp(this.#img_sz, this.#img_sz, '#000000', (err, image) => {
        if (err) throw err
      });
      bg_image.blit(image, 0, 0);

      return bg_image;
    });
  }

  #image2Tensor(img) {
    // 1. Get buffer data from image and create R, G, and B arrays.
    var imageBufferData = img.bitmap.data;
    const [redArray, greenArray, blueArray] = new Array(new Array(), new Array(), new Array());

    // 2. Loop through the image buffer and extract the R, G, and B channels
    for (let i = 0; i < imageBufferData.length; i += 4) {
      redArray.push(imageBufferData[i]);
      greenArray.push(imageBufferData[i + 1]);
      blueArray.push(imageBufferData[i + 2]);
      // skip data[i + 3] to filter out the alpha channel
    }

    // 3. Concatenate RGB to transpose [W, H, 3] -> [3, W, H] to a number array
    const transposedData = redArray.concat(greenArray).concat(blueArray);

    // 4. convert to float32
    let i, l = transposedData.length; // length, we need this for the loop
    // create the Float32Array size 3 * W * H for these dimensions output
    const float32Data = new Float32Array(l);
    for (i = 0; i < l; i++) {
      float32Data[i] = transposedData[i] / 255.0; // convert to float
    }
    // 5. create the tensor object from onnxruntime-web.
    const inputTensor = new ort.Tensor("float32", float32Data, [1, 3, this.#img_sz, this.#img_sz]);
    return inputTensor;
  }

  async #runInference(input) {
    // create feeds with the input name from model export and the preprocessed data.
    const feeds = {};
    feeds[this.#model.inputNames[0]] = input;
    // Run the session inference.
    const outputData = await this.#model.run(feeds);
    // Get output results with the output name from the model export.
    const output = outputData[this.#model.outputNames[0]];

    return output;
  }

  #NMS(output, iou_threshold = 0.5, conf_threshold = 0.25) {
    const dims = output.dims;
    const rows = dims[2];
    const clsNum = dims[1] - 4;
    const rawData = output.data;

    // transform data
    let data = [];
    for (let i = 0; i < rows; ++i) {
      let arr = new Float32Array(clsNum + 4);
      for (let j = 0; j < clsNum + 4; ++j) {
        arr[j] = rawData[(j * rows) + i];
      }
      const center_x = arr[0], center_y = arr[1];
      const half_x = (arr[2] / 2), half_y = (arr[3] / 2);
      arr[0] = center_x - half_x;
      arr[1] = center_y - half_y;
      arr[2] = center_x + half_x;
      arr[3] = center_y + half_y;
      data.push(arr);
    }

    // check confidence threshold
    let conf_arr = new Float32Array(rows);
    let label_arr = new Uint8Array(rows);
    let index = new Set();
    for (let i = 0; i < rows; i++) {
      let conf = -1, idx;
      for (let j = 0; j < clsNum; ++j) {
        if (conf < data[i][4 + j]) {
          conf = data[i][4 + j];
          idx = j;
        }
      }
      if (conf > conf_threshold) {
        index.add(i);
      }
      conf_arr[i] = conf;
      label_arr[i] = idx;
    }

    // loop
    let select_idx = []
    while (index.size > 0) {
      // find maximum conf index
      let max_conf = -1;
      let max_conf_idx = 0;
      for (let idx of index) {
        let conf = conf_arr[idx];
        if (max_conf < conf) {
          max_conf = conf;
          max_conf_idx = idx;
        }
      }
      select_idx.push(max_conf_idx)

      // area
      const select_width = (data[max_conf_idx][2] - data[max_conf_idx][0]);
      const select_height = (data[max_conf_idx][3] - data[max_conf_idx][1]);
      const select_area = select_width * select_height;
      let new_index = new Set();
      for (let idx of index) {
        // other element area
        const width = (data[idx][2] - data[idx][0]);
        const height = (data[idx][3] - data[idx][1]);
        const area = width * height;

        // overlap
        const overlap_left = Math.max(data[idx][0], data[max_conf_idx][0]);
        const overlap_right = Math.min(data[idx][2], data[max_conf_idx][2]);
        const overlap_top = Math.max(data[idx][1], data[max_conf_idx][1]);
        const overlap_bottom = Math.min(data[idx][3], data[max_conf_idx][3]);
        const overlap_width = Math.max(overlap_right - overlap_left, 0);
        const overlap_height = Math.max(overlap_bottom - overlap_top, 0);
        const overlap_area = overlap_width * overlap_height;

        // IOU
        const iou = (overlap_area) / (select_area + area - overlap_area);
        if (iou < iou_threshold) {
          new_index.add(idx);
        }
      }

      // update index
      index = new_index;
    }

    // confidence, label, box
    let confidence = new Float32Array(select_idx.length);
    let label = new Uint8Array(select_idx.length);
    let box = new Float32Array(select_idx.length * 4);
    for (let i = 0; i < select_idx.length; ++i) {
      const idx = select_idx[i];
      confidence[i] = conf_arr[idx];
      label[i] = label_arr[idx];
      box[i * 4 + 0] = data[idx][0];
      box[i * 4 + 1] = data[idx][1];
      box[i * 4 + 2] = data[idx][2];
      box[i * 4 + 3] = data[idx][3];
    }

    return [confidence, label, box];
  }
}

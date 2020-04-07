const _CORS_ = 'https://cors-anywhere.herokuapp.com/';
const _GET_INFO_ =
  'http://ec2-18-138-214-93.ap-southeast-1.compute.amazonaws.com:2802/get_info';
const _GET_ALL =
  'http://ec2-18-138-214-93.ap-southeast-1.compute.amazonaws.com:2802/get_top_image/8';
const _GET_BY_ID_ =
  'http://ec2-18-138-214-93.ap-southeast-1.compute.amazonaws.com:2802/get_info/2073061';
const _GET_ALL_BY_IDS_ =
  'http://ec2-18-138-214-93.ap-southeast-1.compute.amazonaws.com:2802/get_info_list';
const _DETECT_ =
  'http://ec2-18-138-214-93.ap-southeast-1.compute.amazonaws.com:2802/detection/';

document.addEventListener('DOMContentLoaded', function () {
  initEvents();
  const visual = new Visual();
  visual.showImages();
  visual.showProduct();
  visual.upload();
});

class Visual {
  constructor() {}

  getAllImages() {
    return axios
      .get(`${_CORS_}${_GET_ALL}`)
      .then((res) => {
        return res.data.images;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  getProductById(id) {
    return axios
      .get(`${_CORS_}${_GET_BY_ID_}`)
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  showImages() {
    toggleLoader(true);
    let markup = '';
    this.getAllImages().then((image) => {
      image.forEach((img, i) => {
        markup += `<figure class="vs-search__try-figure">
                    <img crossorigin="anonymous" class="top-img" src="${img}" alt="demo" />
                  </figure>`;
      });
      document
        .querySelector('.vs-search__try')
        .insertAdjacentHTML('afterbegin', markup);
      toggleLoader(false);
    });
  }

  showProduct() {}

  upload() {
    document
      .querySelector('#file')
      .addEventListener('change', function (event) {
        event.preventDefault();

        if (!this.value) {
          return;
        }

        toggleLoader(true);
        var input, canvas, context, output;
        input = document.getElementById('file');
        canvas = document.getElementById('canvas');
        context = canvas.getContext('2d');
        output = document.getElementById('output');
        var imagefile = this;

        var reader = new FileReader();
        reader.readAsDataURL(this.files[0]);

        reader.addEventListener('loadend', function (arg) {
          var src_image = new Image();

          src_image.onload = function () {
            canvas.height = src_image.height;
            canvas.width = src_image.width;
            context.drawImage(src_image, 0, 0);
            var imageData = canvas.toDataURL('image/png');
            output.src = imageData;
            uploadCanvas(imageData, true).then((res) => {
              var { res, formData } = res;
              clearContent('.detect-detail__left-figure');
              const mainSrc = URL.createObjectURL(event.target.files[0]);
              let markup = `<img class="main-detect" src="${mainSrc}" alt="detect" />`;
              const detectObj = res.data.boxes;
              const labels = res.data.labels;
              let labelHTML = '';

              detectObj.forEach((obj, i) => {
                markup += `<div class="detect-obj detect-obj--${i + 1} ${
                  i === 0 ? 'active' : ''
                }" style="width: ${Math.ceil(obj.width)}px; height: ${Math.ceil(
                  obj.height
                )}px; top: ${Math.ceil(obj.y)}px; left: ${Math.ceil(
                  obj.x
                )}px; z-index: 2">
                            <a class="detect-obj__link" href="#" data-related="${
                              labels[i]
                            }">${i + 1}</a>
                          </div>`;
              });

              labels.forEach((label, i) => {
                labelHTML += `<li class="detect__item${
                  i === 0 ? ' active' : ''
                }" data-related="${label}">
                              <span class="detect__num">${i + 1}</span>
                              <span class="detect__text">${label}</span>
                            </li>`;
              });

              $('.detect__list').html(labelHTML);
              $('.category-title__text').text(
                $('.detect__item.active .detect__text').text()
              );

              document
                .querySelector('.detect-detail__left-figure')
                .insertAdjacentHTML('beforeend', markup);

              const detectActive = $('.detect-obj.active');
              const width = detectActive.css('width').replace('px', '');
              const height = detectActive.css('height').replace('px', '');
              const x = detectActive.css('left').replace('px', '');
              const y = detectActive.css('top').replace('px', '');

              showRelated(x, y, width, height, formData).then((data) => {
                $('.vs-search__detect').addClass('show');
                toggleLoader(false);
              });
            });
          };

          src_image.src = this.result;
        });
      });
  }
}

function toggleLoader(toggle) {
  toggle
    ? document.querySelector('.loader').classList.add('show')
    : document.querySelector('.loader').classList.remove('show');
}

function clearContent(parent) {
  document.querySelector(parent).innerHTML = '';
}

function initEvents() {
  document
    .querySelector('.detect-detail')
    .addEventListener('click', function (e) {
      e.preventDefault();
      if (e.target.className === 'detect-obj__link') {
        removeDetectActive();
        removeTagActive();
        $('.detect-obj').css('z-index', 2);
        var _this = e.target;
        var target = _this.dataset.related;
        _this.parentElement.style.zIndex = 1;
        _this.parentElement.classList.add('active');
        selectSingle('[data-related="' + target + '"]').classList.add('active');
        updateCategoryText(target);

        var formData = new FormData();
        var imagefile = document.querySelector('#file');
        formData.append('image', imagefile.files[0]);

        var width = $(e.target).parent().css('width').replace('px', '');
        var height = $(e.target).parent().css('height').replace('px', '');
        var x = $(e.target).parent().css('left').replace('px', '');
        var y = $(e.target).parent().css('top').replace('px', '');

        toggleLoader(true);
        showRelated(x, y, width, height, formData).then((data) => {
          toggleLoader(false);
        });
      }
    });

  var tags = [...selectAll('.detect__list .detect__item')];
  tags.forEach(function (tag) {
    tag.addEventListener('click', function (e) {
      e.preventDefault();
      removeTagActive();
      removeDetectActive();
      this.classList.add('active');
      var target = this.dataset.related;
      selectAll(
        '[data-related="' + target + '"]'
      )[1].parentElement.classList.add('active');
      updateCategoryText(target);
      updateImage(target);
    });
  });
}

function removeTagActive() {
  var tags = [...selectAll('.detect__list .detect__item')];
  tags.forEach(function (tag) {
    tag.classList.remove('active');
  });
}

function removeDetectActive() {
  var detectItem = [...selectAll('.detect-obj')];
  detectItem.forEach(function (item) {
    item.classList.remove('active');
  });
}

function updateImage(target) {
  var figures = [...selectAll('.detect-related figure img')];
  figures.forEach(function (figure, i) {
    figure.src = dataRelated[target][i];
  });
}

function updateCategoryText(text) {
  var categoryText = selectSingle('.category-title span');
  categoryText.innerText = text;
}

function selectAll(className) {
  return document.querySelectorAll(className);
}

function selectSingle(className) {
  return document.querySelector(className);
}

function showRelated(x, y, width, height, formData) {
  const ids = async () => {
    try {
      return await axios
        .post(
          `${_CORS_}http://ec2-18-138-214-93.ap-southeast-1.compute.amazonaws.com:2802/related_imgs/top/10/${x}/${y}/${width}/${height}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )
        .then((res) => {
          return res.data.top_products;
        });
    } catch (err) {
      console.log(err);
    }
  };

  return ids().then((ids) => {
    axios
      .post(`${_CORS_}${_GET_ALL_BY_IDS_}`, { list_id: ids })
      .then((res) => {
        if (res == null) {
          $('.detect-related').html('<h1>Không có sản phẩm cần tìm</h1>');
          return;
        }
        console.log(res);
        let html = '';
        $('.detect-related').html('');
        const relatedProducts = res.data.relate_product;
        relatedProducts.forEach((product) => {
          html += `<figure>
                    <a href="${product.product_link}" target="_blank" onclick="window.open(this.href, '_blank')">
                      <img src="${product.image_src}" alt="related" />
                    </a>
                    <figcaption>
                      <p>${product.name}</p>
                      <p>${product.price}</p>
                    </figcaption>
                  </figure>`;
        });
        $('.detect-related').html(html);
        return true;
      })
      .catch((err) => {
        $('.detect-related').html('<h1>Không có sản phẩm cần tìm</h1>');
        console.log(err);
      });
  });
}

function clickFigure() {
  // from an input element
  var filesToUpload = input.files;
  var file = filesToUpload[0];

  var img = this;
  var reader = new FileReader();
  reader.onload = function (e) {
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);

  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  var MAX_WIDTH = 800;
  var MAX_HEIGHT = 600;
  var width = img.width;
  var height = img.height;

  if (width > height) {
    if (width > MAX_WIDTH) {
      height *= MAX_WIDTH / width;
      width = MAX_WIDTH;
    }
  } else {
    if (height > MAX_HEIGHT) {
      width *= MAX_HEIGHT / height;
      height = MAX_HEIGHT;
    }
  }
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  var dataurl = canvas.toDataURL('image/png');

  //Post dataurl to the server with AJAX
}

function uploadCanvas(dataURL, formFile = false) {
  var blobBin = atob(dataURL.split(',')[1]);
  var array = [];
  for (var i = 0; i < blobBin.length; i++) {
    array.push(blobBin.charCodeAt(i));
  }
  var file = new Blob([new Uint8Array(array)], { type: 'image/png' });
  var formData = new FormData();
  var imagefile = document.querySelector('#file');
  if (formFile) {
    formData.append('image', imagefile.files[0]);
  } else {
    formData.append('image', file);
  }

  return axios
    .post(`${_CORS_}${_DETECT_}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((res) => {
      return {
        formData,
        res,
      };
    })
    .catch((err) => {
      console.log(err);
    });
}

document.querySelector('.vs-container').addEventListener('click', function (e) {
  if ($(e.target).hasClass('top-img')) {
    e.preventDefault();
    var src = e.target.src;
    toggleLoader(true);

    var input, canvas, context, output;
    input = document.getElementById('file');
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    output = document.getElementById('output');

    canvas.height = 600;
    canvas.width = 400;
    context.drawImage(e.target, 0, 0, 400, 600);
    var imageData = canvas.toDataURL('image/png');
    output.src = imageData;
    uploadCanvas(imageData).then((res) => {
      var { res, formData } = res;
      clearContent('.detect-detail__left-figure');
      const mainSrc = src;
      let markup = `<img class="main-detect" src="${mainSrc}" alt="detect" />`;
      const detectObj = res.data.boxes;
      const labels = res.data.labels;
      let labelHTML = '';
      console.log(markup);

      detectObj.forEach((obj, i) => {
        markup += `<div class="detect-obj detect-obj--${i + 1} ${
          i === 0 ? 'active' : ''
        }" style="width: ${Math.ceil(obj.width)}px; height: ${Math.ceil(
          obj.height
        )}px; top: ${Math.ceil(obj.y)}px; left: ${Math.ceil(
          obj.x
        )}px; z-index: 1">
                            <a class="detect-obj__link" href="#" data-related="${
                              labels[i]
                            }">${i + 1}</a>
                          </div>`;
      });

      labels.forEach((label, i) => {
        labelHTML += `<li class="detect__item${
          i === 0 ? ' active' : ''
        }" data-related="${label}">
                              <span class="detect__num">${i + 1}</span>
                              <span class="detect__text">${label}</span>
                            </li>`;
      });

      $('.detect__list').html(labelHTML);
      $('.category-title__text').text(
        $('.detect__item.active .detect__text').text()
      );

      document
        .querySelector('.detect-detail__left-figure')
        .insertAdjacentHTML('beforeend', markup);

      const detectActive = $('.detect-obj.active');
      const width = detectActive.css('width').replace('px', '');
      const height = detectActive.css('height').replace('px', '');
      const x = detectActive.css('left').replace('px', '');
      const y = detectActive.css('top').replace('px', '');

      showRelated(x, y, width, height, formData).then((data) => {
        $('.vs-search__detect').addClass('show');
        toggleLoader(false);
      });
    });
  }
});

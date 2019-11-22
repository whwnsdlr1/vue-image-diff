# vue-image-diff
![Alt Text](example.gif)
vue component for multiple image comparison.
currently supported only 8bit jpg and png format.

Web-App: [https://github.com/whwnsdlr1/image-diff](https://github.com/whwnsdlr1/image-diff)
<br />
jsfiddle1: [https://jsfiddle.net/whwnsdlr1/xgz21e95/](https://jsfiddle.net/whwnsdlr1/xgz21e95/)
<br />
jsfiddle2: 44
<br />

## Usage
in Vue Project
```html
<template>
...
<vue-image-diff :data="data" :options="options" :options-tool-bar="optionsToolBar" />
...
</template>
<script>
import VueImageDiff from 'vue-image-diff'
export default {
  ...
  components: {
    'vue-image-diff': VueImageDiff
  }
  ...
}
</script>
```

in html
```html
<body>
<script src="vue.js"></script><!-- include vue.js first! -->
<script src="VueImageDiff.js"></script>
...
<vue-image-diff :data=data :options=options :options-tool-bar=optionsToolBar />
...
</body>
```
data is array of object.
```js
data = [
  {
    name: 'korea Mountains', // String: text to show overlay region
    blob: blob, // Blob: ImageBlob to show
    ext: 'jpg' // String: 'jpg' or 'png'
    params: {author: 'fxgsell'}, // Object, (optional): default value is {}. text to show overlay region
    id: id // String, (optional): default value is created by uuid4(). unique id 
  }
]
```

options is object
```js
options = {
  coord: {
    x: 0, // Number, (optional): default value is 0. coordinate x
    y: 0 // Number, (optional): default value is 0. coordinate y
  },
  zoom: 1, // Number, (optional): default value is calculate by windows. zoom, scale value. 1 is original scale
  voi: {
    windowCenter: 127, // Number, (optional): default value is 127. range (0, 255]. adjust brightness
    windowWidth: 256 // Number, (optional): default value is 256. range (1, 256]. adjust contrast
  },
  predefinedImageSize: {
    width: undefined, // Number or undefined, (optional): default value in undefined. width to be resized. if not set, other images are resized based on the first image size.
    height: undefined // Number or undefined, (optional): default value in undefined. height to be resized. if not set, other images are resized based on the first image size.
  },
  diff: {
    activate: false, // Bool, (optional): default value is false. flag to show diff ovelary
    reference: {
      id: undefined, // String or undefined, (optional): default value is undefined. base image to diff. if not set, it is selected as the first image.
    },
    tolerance: 1, // Number, (optional): default value is 1. range [1, 441]. if difference value(Mean Square Error) is greater than or equal tolerance, pixel is set difference-tag. opposite, set same-tag less than tolerance. ![equation](http://latex.codecogs.com/png.latex?%5Csum_%7BP%7D%5E%7Bp%7D%28%5Csqrt%7B%28R_%7Bp1%7D-R_%7Bp2%7D%29%5E%7B2%7D%20&plus;%20%28G_%7Bp1%7D-G_%7Bp2%7D%29%5E%7B2%7D%20&plus;%20%28B_%7Bp1%7D-B_%7Bp2%7D%29%5E%7B2%7D%7D%29)
    opacity: 0.7, // Number, (optional): default value is 0.7. range (0, 1). opacity of diff overlay
    colors: {
      same: new Uint8ClampedArray([0, 0, 255]), // Array, (optional): default value is [0, 0, 255]. color rgb of same-tag pixel
      diff: new Uint8ClampedArray([255, 0, 0]) // Array, (optional): default value is [0, 0, 255]. color rgb of diff-tag pixel
    }
  },
  style: {
    borderWidth: 1, // Number, (optional): default value is [1, infty). border width between frames.
    borderColor: new Uint8ClampedArray([255, 0, 0]), // Array, (optional): default value is [255, 0, 0]. color rgb of border
    showOverlayText: true, // Bool, (optional): default value is true. flag to show overlay text
    frameRowCount: 3 // Number or undefined, (optional): default value is undefined. range [1, infty). frame row count. if not set, calcuate by data length.
  }
}
```

options is object
```js
optToolBar = {
  show: true, // Bool, (optional)
  pan: {
    show: true, // Bool, (optional)
    disabled: false // Bool, (optional)
  },
  zoom: {
    show: true, // Bool, (optional)
    disabled: false // Bool, (optional)
  },
  diff: {
    show: true, // Bool, (optional)
    ref: {
      show: true // Bool, (optional)
    },
    tolerance: {
      show: true // Bool, (optional)
    }
  }
}
```

### Control
- mouse & touch drag - panning
- mouse wheel & pinch to zoom - zoom in / out
- mouse doubleclick - select reference image for diff

## Browser support - (tested)
- Google Chrome 77+
- Google Chrome 77+ on Android 9+
- Mozilla FireFox 68+

## Project setup
### Build
build project as below
```
git clone https://github.com/whwnsdlr1/vue-image-diff
cd vue-image-diff
yarn run build
```
### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## Third-party libraries
### Dependencies
- vue: [https://github.com/vuejs/vue](https://github.com/vuejs/vue)
- cornerstone-core: [https://github.com/cornerstonejs/cornerstone](https://github.com/cornerstonejs/cornerstone)
- jpeg-js: [https://github.com/eugeneware/jpeg-js](https://github.com/eugeneware/jpeg-js)
- pngjs: [https://github.com/arian/pngjs](https://github.com/arian/pngjs)
- element-resize-event: [https://github.com/KyleAMathews/element-resize-event](https://github.com/KyleAMathews/element-resize-event)
- vue-lodash: [https://github.com/Ewocker/vue-lodash](https://github.com/Ewocker/vue-lodash)

### Dev-Dependencies
- @vue/cli-plugin-babel
- @vue/cli-plugin-eslint
- @vue/cli-service
- babel-eslint
- eslint
- eslint-plugin-vue
<<<<<<< HEAD
- vue-template-compiler
=======
- vue-template-compiler

## TO-DO
- support other image format(bmp, tiff)
>>>>>>> 178c8e43b796b7c6fef2decb6685709138db91fb

<template>
<div class="body" oncontextmenu="return false">
  <tool-bar
    v-if="optToolBar.show"
    ref="tool-bar"
    :options="optToolBar"
    :state="state"
    @state-tochange="listen__state__tochange"
    @state-toreset="listen__state__toreset" />
  <div class="view"
    ref="view"
    @touchstart="listen__view__on_x_down($event, 'touch')"
    @mousedown="listen__view__on_x_down($event, 'mouse')"
    @wheel="listen__view__onwheel">
    <div class="row-frame" v-for="(frameRow, row) in frame2D" :key="`row-${row}`">
      <div class="col-frame" v-for="(frameData, col) in frameRow" :key="`col-${row}-${col}-${state.style.frameRowCount}`"
        @dblclick="listen__frame__ondblclick(frameData)">
        <frame
          :class="`frame-${row}-${col}`"
          :frame-data="frameData"
          :state="state"
          :style="{ borderTop: getFrameBorder(row, col, true), borderLeft: getFrameBorder(row, col, false) }" />
      </div>
    </div>
  </div>
  <div class="layer" v-show="layer.active">
    <div>
      <div class="w-spinner"><div class="spinner" v-show="layer.errorMessage == ''"></div></div>
      <span>{{ layer.message }}</span>
    </div>
    <span style="color:rgb(255, 0, 0)">{{ layer.errorMessage }}</span>
  </div>
</div>
</template>

<script>
/* eslint-disable no-console */
import Vue from 'vue'
import cornerstonePlugin from '@/plugins/cornerstonePlugin'
import mModal from '@/plugins/modal'

import Frame from '@/components/Frame'
import ToolBar from '@/components/ToolBar'

import PARSE from '@/js/parse.js'
import MISC from '@/js/miscellaneous.js'
import ImageSimilarity from '@/js/image_similarity.js'

Vue.use(cornerstonePlugin)
Vue.use(mModal)

function sleep (ms) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms)
  })
}

export default {
  name: 'app',
  props: {
    'data': {
      type: Array,
      default: function () {
        return []
      }
    },
    'options': {
      type: Object
    },
    'options-tool-bar': {
      type: Object
    }
  },
  components: {
    'frame': Frame,
    'tool-bar': ToolBar
  },
  data: function () {
    function assignOpt (refObj, newObj) {
      for (let key in newObj) {
        if (refObj[key] != undefined) {
          if (typeof(refObj[key]) == 'object' && refObj[key].toString() == "[object Object]") {
            assignOpt(refObj[key], newObj[key])
          } else {
            refObj[key] = newObj[key]
          }
        }
      }
    }
    let state = {
      numFramesData: 0,
      coord: {
        x: 0,
        y: 0
      },
      zoom: 1,
      voi: {
        windowCenter: 127,
        windowWidth: 256
      },
      predefinedImageSize: {
        width: undefined,
        height: undefined
      },
      diff: {
        activate: false,
        reference: {
          id: undefined,
        },
        tolerance: 1,
        opacity: 0.7,
        colors: {
          same: new Uint8ClampedArray([0, 0, 255]),
          diff: new Uint8ClampedArray([255, 0, 0])
        }
      },
      style: {
        borderWidth: 1,
        borderColor: new Uint8ClampedArray([255, 0, 0]),
        showOverlayText: true,
        frameRowCount: 3
      }
    }

    assignOpt(state, this.options)
    const initialState = JSON.parse(JSON.stringify(state))
    let optToolBar = {
      show: true,
      pan: {
        show: true,
        disabled: false
      },
      zoom: {
        show: true,
        disabled: false
      },
      diff: {
        show: true,
        ref: {
          show: true
        },
        tolerance: {
          show: true
        }
      }
    }
    assignOpt(optToolBar, this.optionsToolBar)
    return {
      optToolBar,
      framesData: [],
      initialState,
      state,
      internalState: {
        moveTouch: undefined,
        zoomTouch: undefined
      },
      diffs: undefined,
      psnrs: undefined,
      layer: {
        active: false,
        message: '',
        errorMessage: ''
      }
    }
  },
  methods: {
    listen__data__onchange: async function (data) {
      const Vue = this
      Vue.layer.active = true
      Vue.doubleRaf(async () => {
        try {
          let framesData0 = []
          let framesData = []
          if (data.length > 0) {
            for (const datum of data) {
              Vue.layer.message = `parse ${datum.name}`
              const res = await PARSE.parseImage(datum.blob, datum.ext)
              
              framesData0.push({
                id: datum.id != undefined ? datum.id : MISC.getUuid4(),
                image: res,
                name: datum.name,
                params: datum.params != undefined ? datum.params : {},
                index: datum.index != undefined ? datum.index : 0
              })
            }
            framesData0.sort((v1, v2) => v1.index - v2.index)
            let defWidth
            let defHeight
            if (Vue.state.predefinedImageSize.width != undefined && Vue.state.predefinedImageSize.height != undefined) {
              defWidth = Vue.state.predefinedImageSize.width
              defHeight = Vue.state.predefinedImageSize.height
            } else {
              defWidth = framesData0[0].image.width
              defHeight = framesData0[0].image.height
            }
            for (let idx in framesData0) {
              const datum = framesData0[idx]
              const image = datum.image
              let cornerstoneImage
              let resized
              if (defWidth != image.width || defHeight != image.height) {
                const pixelData = MISC.resizeImg(image.pixelData, image.width, image.height, defWidth, defHeight)
                cornerstoneImage = await Vue.$cornerstone.createCornerstoneImageRgba(undefined, pixelData, defWidth, defHeight)
                resized = true
              } else {
                cornerstoneImage = await Vue.$cornerstone.createCornerstoneImageRgba(undefined, image.pixelData, defWidth, defHeight)
                resized = false
              }
              
              framesData.push({
                id: datum.id,
                cornerstoneImage,
                diff: {
                  cornerstoneImage: undefined,
                  pixelCount: undefined,
                  psnr: undefined,
                  updated: 0,
                  opacity: Vue.state.diff.opacity
                },
                name: datum.name,
                params: datum.params,
                resized
              })
            }
      
            if (Vue.state.style.frameRowCount == undefined) {
              if (data.length < 3) Vue.state.style.frameRowCount = 1
              else if (data.length < 9) Vue.state.style.frameRowCount = 2
              else Vue.state.style.frameRowCount = 3
            }
            const style = getComputedStyle(Vue.$refs['view'])
            const thumbnailHeight = parseInt(style.height) / Vue.state.style.frameRowCount
            const thumbnailWidth = parseInt(style.width) / Math.ceil(data.length / Vue.state.style.frameRowCount)
            const scaleY = thumbnailHeight / defHeight
            const scaleX = thumbnailWidth / defWidth
            Vue.state.coord = {x: 0, y: 0}
            Vue.state.zoom = (scaleY < scaleX)? scaleY : scaleX
          }

          Vue.framesData = framesData
          Vue.state.numFramesData = Vue.framesData
          Vue.layer.active = false
        } catch (err) {
          console.log(err)
          Vue.layer.errorMessage = err
        }
      })
    },
    listen__view__on_x_down: function (e, type) {
      const Vue = this
      if (Vue.state.numFramesData == 0)
        return
      function mouseLeftUpHandler (e) {
        if (e.which == 1) {
          Vue.$el.removeEventListener('mousemove', mouseLeftMoveHandler)
          Vue.$el.removeEventListener('mouseup', mouseLeftUpHandler)
        }
      }
      function mouseRightUpHandler (e) {
        if (e.which == 3) {
          Vue.$el.removeEventListener('mousemove', mouseRightMoveHandler)
          Vue.$el.removeEventListener('mouseup', mouseRightUpHandler)
        }
      }
      function touchUpHandler (e) {
        if (Array.prototype.findIndex.call(e.changedTouches, v => v.identifier == Vue.internalState.moveTouch.identifier) == -1) return
        Vue.internalState.moveTouch = undefined

        Vue.$el.removeEventListener('touchmove', touchMoveHandler)
        Vue.$el.removeEventListener('touchend', touchUpHandler)
      }
      function touchUpHandler2 (e) {
        if (Array.prototype.findIndex.call(e.changedTouches, v => v.identifier == Vue.internalState.zoomTouch.identifier) == -1) return
        Vue.internalState.zoomTouch = undefined

        Vue.$el.removeEventListener('touchmove', touchMoveHandler2)
        Vue.$el.removeEventListener('touchend', touchUpHandler2)
      }
      function mouseLeftMoveHandler (e) {
        const deltaX = e.pageX - lastX
        const deltaY = e.pageY - lastY
        lastX = e.pageX
        lastY = e.pageY

        const x = Vue.state.coord.x + (deltaX / Vue.state.zoom)
        const y = Vue.state.coord.y + (deltaY / Vue.state.zoom)
        Vue.state.coord = {x, y}
      }
      function mouseRightMoveHandler (e) {
        const deltaX = e.pageX - lastX
        const deltaY = e.pageY - lastY
        lastX = e.pageX
        lastY = e.pageY

        const windowWidth = Math.min(256, Math.max(1, Vue.state.voi.windowWidth + (deltaX / Vue.state.zoom)))
        const windowCenter = Math.min(255, Math.max(0, Vue.state.voi.windowCenter + (deltaY / Vue.state.zoom)))
        Vue.state.voi = {windowWidth, windowCenter}
      }
      function touchMoveHandler (e) {
        const idx = Array.prototype.findIndex.call(e.changedTouches, v => v.identifier == Vue.internalState.moveTouch.identifier)
        if (idx == -1) return
        const touch = e.changedTouches[idx]

        const deltaX = touch.pageX - lastX
        const deltaY = touch.pageY - lastY
        lastX = touch.pageX
        lastY = touch.pageY

        if (Vue.internalState.zoomTouch == undefined) {
          const x = Vue.state.coord.x + (deltaX / Vue.state.zoom)
          const y = Vue.state.coord.y + (deltaY / Vue.state.zoom)
          Vue.state.coord = {x, y}
        }
      }
      function touchMoveHandler2 (e) {
        const idx = Array.prototype.findIndex.call(e.changedTouches, v => v.identifier == Vue.internalState.zoomTouch.identifier)
        if (Vue.internalState.moveTouch == undefined || idx == -1) return
        const touch = e.changedTouches[idx]

        const cdist = 2.5 * (Math.abs(touch.pageX - Vue.internalState.moveTouch.pageX) + Math.abs(touch.pageY - Vue.internalState.moveTouch.pageY)) / (window.innerHeight + window.innerWidth)
        if (dist == undefined) {
          dist = cdist
          return
        }
        const as = cdist - dist
        dist = cdist
        const scale = Vue.state.zoom + as
        if (scale > 0) Vue.state.zoom = scale
      }
      function mouseLeftDownHandler () {
        Vue.$el.addEventListener('mousemove', mouseLeftMoveHandler)
        Vue.$el.addEventListener('mouseup', mouseLeftUpHandler)
      }
      function mouseRightDownHandler () {
        Vue.$el.addEventListener('mousemove', mouseRightMoveHandler)
        Vue.$el.addEventListener('mouseup', mouseRightUpHandler)
      }
      function touchDownHandler () {
        Vue.$el.addEventListener('touchmove', touchMoveHandler)
        Vue.$el.addEventListener('touchend', touchUpHandler)
      }
      function touchDown2Handler () {
        Vue.$el.addEventListener('touchmove', touchMoveHandler2)
        Vue.$el.addEventListener('touchend', touchUpHandler2)
      }

      if (Vue.state.coord == undefined) return

      e.preventDefault()
      let lastX, lastY, dist
      if (type == 'touch' && e.which == 0) {
        if (Vue.internalState.moveTouch != undefined) {
          Vue.internalState.zoomTouch = Vue.copyTouch(e.changedTouches[0])
          touchDown2Handler()
        } else {
          Vue.internalState.moveTouch = Vue.copyTouch(e.changedTouches[0])
          lastX = e.changedTouches[0].pageX
          lastY = e.changedTouches[0].pageY
          touchDownHandler()
        }
      } else if (type == 'mouse' && e.which == 1) {
        lastX = e.pageX
        lastY = e.pageY
        mouseLeftDownHandler()
      }
      else if (type == 'mouse' && e.which == 3) {
        lastX = e.pageX
        lastY = e.pageY
        mouseRightDownHandler()
      }
    },
    listen__view__onwheel: function (e) {      
      const Vue = this
      if (Vue.state.numFramesData == 0)
        return
      if (Vue.state.zoom == undefined) return

      const as = e.wheelDelta < 0 || e.detail > 0 ? -0.10 : 0.10
      const scale = Vue.state.zoom + as
      if (scale > 0) Vue.state.zoom = scale
      return false
    },
    listen__frame__ondblclick: function (frameData) {
      if (frameData != undefined && this.state.diff.activate == true) {
        if (frameData.id != this.state.diff.reference.id) {
          this.listen__state__tochange({diff: {reference: {id: frameData.id}}})
        }
      }
    },
    listen__state__tochange: function (data) {
      const Vue = this
      Vue.layer.message = 'update state...'
      Vue.layer.active = true
      Vue.doubleRaf(async () => {
        if (data.coord != undefined) {
          Vue.state.coord = data.coord
        }
        if (data.zoom != undefined) {
          Vue.state.zoom = data.zoom
        }
        if (data.voi != undefined) {
          Vue.state.voi = data.voi
        }
        if (data.diff != undefined) {
          if (data.diff.activate != undefined) {
            Vue.state.diff.activate = data.diff.activate
          }

          if (Vue.state.diff.activate == true) {
            Vue.layer.message = 'check pre-cacluated diff'
            await Vue.nextTick()
            let framesData = Vue.framesData
            for (let i = 0; i < framesData.length; i++) {
              let frameData = framesData[i]
              if (frameData == undefined) continue
              if (frameData.diff.cornerstoneImage == undefined) {
                Vue.layer.message = `create ${frameData.name}'s layer image.`
                await Vue.nextTick()
                frameData.diff.cornerstoneImage = await Vue.$cornerstone.createCornerstoneImageRgba(
                  undefined,
                  new Uint8Array(frameData.cornerstoneImage.width * frameData.cornerstoneImage.height * 4).fill(255),
                  frameData.cornerstoneImage.width,
                  frameData.cornerstoneImage.height
                )
              }
            }
            if (Vue.diffs == undefined) {
              let diffs = {}
              let psnrs = {}
              for (let i1 = 0; i1 < framesData.length - 1; i1++) {
                const frameData1 = framesData[i1]
                const pixelData1 = frameData1.cornerstoneImage.getPixelData()
                Vue.layer.message = `caculate diff between ${frameData1.name} and other images.`
                await Vue.nextTick()
                for (let i2 = i1 + 1; i2 < framesData.length; i2++) {
                  const frameData2 = framesData[i2]
                  const pixelData2 = frameData2.cornerstoneImage.getPixelData()
                  let diff = new Int16Array(frameData2.cornerstoneImage.width * frameData2.cornerstoneImage.height)
                  
                  for (let ip = 0; ip < diff.length; ip++) {
                    const p1 = ip * 4
                    const p2 = p1 + 1
                    const p3 = p1 + 2
                    diff[ip] = ((pixelData1[p1] - pixelData2[p1]) ** 2 + (pixelData1[p2] - pixelData2[p2]) ** 2 + (pixelData1[p3] - pixelData2[p3]) ** 2) ** 0.5
                  }
                  diffs[`${frameData1.id}x${frameData2.id}`] = diff
                  psnrs[`${frameData1.id}x${frameData2.id}`] = ImageSimilarity.calcPsnrRgba(pixelData1, pixelData2)
                }
              }
              Vue.diffs = diffs
              Vue.psnrs = psnrs
            }

            let isChangeTolerance = false
            if (data.diff.tolerance != undefined) {
              Vue.state.diff.tolerance = data.diff.tolerance
              isChangeTolerance = true
            }
            let isChangeReference = false
            if (data.diff.reference != undefined) {
              if (data.diff.reference.id != undefined) {
                Vue.state.diff.reference.id = data.diff.reference.id
                let referenceFrameData = Vue.framesData[Vue.framesData.map(v => v.id).indexOf(data.diff.reference.id)]
                isChangeReference = true
                referenceFrameData.diff.pixelCount = undefined
                referenceFrameData.diff.psnr = undefined
              }
            }
            if (Vue.state.diff.reference.id == undefined) {
              Vue.state.diff.reference.id = Vue.framesData[0].id
              let referenceFrameData = Vue.framesData[Vue.framesData.map(v => v.id).indexOf(Vue.framesData[0].id)]
              isChangeReference = true
              referenceFrameData.diff.pixelCount = undefined
              referenceFrameData.diff.psnr = undefined
            }
            if (isChangeTolerance || isChangeReference) {
              const tolerance = Vue.state.diff.tolerance
              const frameId1 = Vue.framesData[Vue.framesData.map(v => v.id).indexOf(Vue.state.diff.reference.id)].id
              for (let i2 = 0; i2 < Vue.framesData.length; i2++) {
                let frameData2 = Vue.framesData[i2]
                if (frameId1 == frameData2.id) continue

                let diffArray = Vue.diffs[`${frameId1}x${frameData2.id}`]
                if (diffArray == undefined) diffArray = Vue.diffs[`${frameData2.id}x${frameId1}`]
                let pixelData2 = frameData2.diff.cornerstoneImage.getPixelData()
                let diffPixelCount = 0
                const colorDiff = Vue.state.diff.colors.diff
                const colorSame = Vue.state.diff.colors.same
                for (let np = 0; np < diffArray.length; np ++) {
                  const isDiff = diffArray[np] >= tolerance
                  const p1 = 4 * np
                  const p2 = p1 + 1
                  const p3 = p2 + 1
                  if (isDiff == false) {
                    pixelData2[p1] = colorSame[0]
                    pixelData2[p2] = colorSame[1]
                    pixelData2[p3] = colorSame[2]
                  } else {
                    pixelData2[p1] = colorDiff[0]
                    pixelData2[p2] = colorDiff[1]
                    pixelData2[p3] = colorDiff[2]
                    diffPixelCount++
                  }
                }
                Vue.framesData[i2].diff.pixelCount = diffPixelCount
                let psnr = Vue.psnrs[`${frameId1}x${frameData2.id}`]
                if (psnr == undefined) psnr = Vue.psnrs[`${frameData2.id}x${frameId1}`]
                Vue.framesData[i2].diff.psnr = psnr
              }  
            }

            for (let nf = 0; nf < Vue.framesData.length; nf++) {
              let frameData = Vue.framesData[nf]
              if (frameData.id == Vue.state.diff.reference.id) Vue.framesData[nf].diff.updated = 0
              else Vue.framesData[nf].diff.updated += 1
            }
          } else {
            for (let nf = 0; nf < Vue.framesData.length; nf++) {
              Vue.framesData[nf].diff.updated = 0
            }
          }
        }
        Vue.layer.active = false
      })
    },
    listen__state__toreset: function () {
      this.listen__state__tochange(this.initialState)
    },
    copyTouch: function (touch) {
      return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
    },
    arrangeFrames: function (data, frameRowCount) {
      function _arrangeFrames (data, frameRowCount) {
        if (data == undefined || data.length == 0) return [[]]

        let framesData = []
        let idx = 0
        const cols = Math.ceil(data.length / frameRowCount)
        for (const datum of data) {
          if (idx % cols == 0) framesData.push([])
          let _frames = framesData[framesData.length - 1]
          _frames.push(datum)
          idx++
        }
        for (; idx < cols * frameRowCount; idx++) {
          const datum = undefined
          if (idx % cols == 0) framesData.push([])
          let _frames = framesData[framesData.length - 1]
          _frames.push(datum)
        }
        return framesData
      }
      
      return _arrangeFrames(data, frameRowCount)
    },
    getFrameBorder: function (row, col, isTop) {
      const Vue = this
      if (isTop) return row > 0? `${Vue.state.style.borderWidth}px solid rgb(${Vue.state.style.borderColor.join(',')})` : ''
      else return col > 0? `${Vue.state.style.borderWidth}px solid rgb(${Vue.state.style.borderColor.join(',')})` : ''
    },
    doubleRaf: function (callback) {
      requestAnimationFrame(() => {
        requestAnimationFrame(callback)
      })
    },
    nextTick: async function (ms = 5) {
      await this.$nextTick()
      await sleep(ms)
    },
    getState: function () {
      // return this.state
      return JSON.parse(JSON.stringify(this.state))
    },
    setState: function () {
    },
    openControlPanel: function () {
      const Vue = this
      const toolBar = Vue.$refs['tool-bar']
      if (toolBar == undefined)
        return
      
      toolBar.listen__cp__onclick()
    }
  },
  computed: {
    frame2D: function () {  
      return this.arrangeFrames(this.framesData, this.state.style.frameRowCount)
    }
  },
  watch: {
    data: function (data) {
      this.listen__data__onchange(data)
    }
  },
  created () {
  },
  updated () {
  },
  async mounted () {
    function fetchImages (data) {
      return new Promise(function(resolve) {
        for (let i = 0; i < data.length; i++) {
          (function (datum, i) {
            fetch(datum.url)
              .then(response => response.blob())
              .then(res => {
                datum.blob = res
                if (i == data.length - 1) {
                  resolve(data)
                }
              })
          }) (data[i], i)
        }
      })
    }
    fetchImages([
      {
        name: 'korea Mountains',
        params: {author: 'fxgsell', license: 'CC BY 2.0'},
        url: 'https://live.staticflickr.com/5081/5223054798_c3fd926b63_c_d.jpg',
        ext: 'jpg'
      },
      {
        name: 'Mt. jiri Korea',
        params: {author: 'Byeong Min Park', license: 'flicker'},
        url: 'https://live.staticflickr.com/5577/15234883386_ffeeb3a263_c_d.jpg',
        ext: 'jpg'
      },
      {
        name: '_SSJ4363',
        params: {author: 'Seungjin Song', license: 'flicker'},
        url: 'https://live.staticflickr.com/1683/24824937304_2d71742e34_c_d.jpg',
        ext: 'jpg'
      }
    ]).then(data => this.listen__data__onchange(data))
  }
}
</script>

<style scoped>
.body {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background-color: #eee;
  background-image: linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%, #ddd),
  linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%, #ddd);
  background-size: 40px 40px;
  background-position: 0 0, 20px 20px;
}
.w-spinner {
  position:relative;
  display:inline-block;
  top: 7px;
  width:20px;
  height:20px;
  margin-right: 8px;
}
div.view {
  display: flex;
  flex-direction: column;
  flex: 1 0 0;
  box-sizing: border-box;
  overflow: hidden;
  margin: 0;
  padding: 0;
}
div.row-frame {
  display: flex;
  flex-direction: row;
  flex: 1 0 0;
  min-width: 0;
  min-height: 0;
}
div.col-frame {
  flex: 1 0 0;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
div.layer {
  position: absolute;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.75);
  align-items: center;
  justify-content: center;
}
div.layer > div, span {
  margin-bottom: 10px;
}
</style>

<style>
#app {
  position: relative;
  height: 100%;
  width: 100%;
  /* font-family: 'Roboto'; */
  /* font-family: 'Manjari', sans-serif; */
}
div {
  position: relative;
  box-sizing: border-box;
}
@keyframes spinner {
  to {transform: rotate(360deg);}
}
.spinner {
  position:relative;
  width: 100%;
  height: 100%;
}
.spinner:before {
  content: '';
  box-sizing: border-box;
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid #999;
  border-top-color: #000;
  animation: spinner .6s linear infinite;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

input[type=number]::-webkit-outer-spin-button,
input[type=number]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  -moz-appearance:textfield;
}
</style>

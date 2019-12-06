<template>
  <div class="body"
    :class="{ 'no-frame-data': frameData._empty == true }">
    <div v-if="frameData._empty == false && state.style.showOverlayText == true" class="overlay">
      <span class="name" :class="{ reference: state.diff.activate == true && state.diff.reference != undefined && (state.diff.reference.id == frameData.id) }">{{ frameData.name }}</span>
      <div v-for="(value, key, index) in frameData.params" :key="`params-${index}`"
        class="params"
        :style="{'margin-top': '0px', 'padding': '0px'}">
        <span class="name">{{ key }}:</span><span class="value">&nbsp;{{ value }}</span>
      </div>
    </div>
    <transition name="fade">
      <div v-if="frameData._empty == false && (state.diff.activate == true)" class="overlay-bottom">
        <span v-for="(text, index) in overlayBottomTexts" :key="`overlay-bottom-text-${index}`"
          :class="text.class">
          {{ text.textContent }}
        </span>
      </div>
    </transition>
  </div>
</template>

<script>
/* eslint-disable no-console */
import lodash from 'lodash'
import elementResizeEvent from 'element-resize-event'

export default {
  props: ['frame-data', 'state'],
  data: function () {
    return {
      imageLayerId: undefined,
      diffLayerId: undefined
    }
  },
  methods: {
    listen__x__onresize: function () {
      const Vue = this
      Vue.$cornerstone.resize(Vue.$el, false)
      if (Vue.frameData._empty == false) {
        let layers = this.$cornerstone.getLayers(this.$el)
        for (let i = 0; i < layers.length; i++) {
          let viewport = layers[i].viewport
          viewport.scale = Vue.state.zoom
          viewport.translation.x = Vue.state.coord.x
          viewport.translation.y = Vue.state.coord.y
        }
        this.$cornerstone.updateImage(this.$el)
      }
    },
    listen__diff__onupdate: function (updated) {
      if (this.diffLayerId != undefined) {
        this.$cornerstone.removeLayer(this.$el, this.diffLayerId)
        this.$cornerstone.updateImage(this.$el)
        this.diffLayerId = undefined
      }
      if (updated > 0) {
        let viewport = JSON.parse(JSON.stringify(this.$cornerstone.getLayer(this.$el, this.imageLayerId).options.viewport))
        viewport.voi.windowWidth = 256
        viewport.voi.windowCenter = 127
        const diffLayerId = this.$cornerstone.addLayer(
          this.$el,
          this.frameData.diff.cornerstoneImage,
          {
            viewport,
            opacity: this.frameData.diff.opacity
          }
        )
        this.diffLayerId = diffLayerId
        this.$cornerstone.updateImage(this.$el)
      }
    }
  },
  computed: {
    overlayBottomTexts: function () {
      let ret = []
      const frameData = this.frameData
      if (frameData.resized == true) ret.push({class: 'tag-resized', textContent: 'resized'})
      else ret.push({class: 'size', textContent: `${frameData.cornerstoneImage.width}x${frameData.cornerstoneImage.height}`})

      if (frameData.diff.psnr != undefined) {
        ret.push({class: 'comma', textContent: `,`})
        if (isNaN(frameData.diff.psnr) == false) ret.push({class: '', textContent: `PSNR-${(frameData.diff.psnr).toFixed(2)}db`})
        else ret.push({class: '', textContent: `PSNR-Same`})
      }
      if (frameData.diff.pixelCount != undefined) {
        ret.push({class: 'comma', textContent: `,`})
        ret.push({class: '', textContent: `${(frameData.diff.pixelCount / (frameData.cornerstoneImage.width * frameData.cornerstoneImage.height) * 100).toFixed(2)}%`})
      }
      
      return ret
    }
  },
  watch: {
    "state.coord": function (coord) {
      if (this.frameData._empty == false && coord != undefined) {
        let layers = this.$cornerstone.getLayers(this.$el)
        for (let i = 0; i < layers.length; i++) {
          let viewport = layers[i].viewport
          viewport.translation.x = coord.x
          viewport.translation.y = coord.y
        }
        this.$cornerstone.updateImage(this.$el)
      }
    },
    'state.zoom': function (zoom) {
      if (this.frameData._empty == false && zoom != undefined) {
        let layers = this.$cornerstone.getLayers(this.$el)
        for (let i = 0; i < layers.length; i++) {
          let viewport = layers[i].viewport
          viewport.scale = zoom
        }
        this.$cornerstone.updateImage(this.$el)
      }
    },
    'state.voi': function (voi) {
      if (this.frameData._empty == false) {
        let layer = this.$cornerstone.getLayer(this.$el, this.imageLayerId)
        layer.viewport.voi.windowWidth = voi.windowWidth
        layer.viewport.voi.windowCenter = voi.windowCenter
        this.$cornerstone.updateImage(this.$el)
      }
    },
    'frameData.diff.updated': function (updated) {
      if (this.frameData._empty == false) {
        this.listen__diff__onupdate(updated)
      }
    }
  },
  mounted () {
    if (this.frameData._empty == false) {
      elementResizeEvent(this.$el, lodash.debounce(this.listen__x__onresize, 10))
      this.$cornerstone.enable(this.$el)
      const image = this.frameData.cornerstoneImage
      let defViewport = this.$cornerstone.getDefaultViewport(this.$el, image)
      
      defViewport.scale = this.state.zoom
      defViewport.translation.y = this.state.coord.y
      defViewport.translation.x = this.state.coord.x
      defViewport.voi.windowCenter = this.state.voi.windowCenter
      defViewport.voi.windowWidth = this.state.voi.windowWidth
      const imageLayerId = this.$cornerstone.addLayer(this.$el, this.frameData.cornerstoneImage, {viewport: defViewport})
      this.imageLayerId = imageLayerId
      this.listen__diff__onupdate(this.frameData.diff.updated)
    }
  },
  beforeDestroy () {
    elementResizeEvent.unbind(this.$el)
    this.$cornerstone.disable(this.$el)
  }
}
</script>

<style scoped>
.body {
  position: relative;
  min-width: 0;
  min-height: 0;
  margin: 0;
  padding: 0;
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
      -moz-user-select: none; /* Firefox */
      -ms-user-select: none; /* Internet Explorer/Edge */
          user-select: none; /* Non-prefixed version, currently
                                supported by Chrome and Opera */
}
.body * {
  pointer-events: none;
}
.overlay {
  position: absolute;
  top: 15px;
  left: 15px;
  background: rgba(255, 255, 255, 0.65);
  border-radius: 5px;
  border: 1px solid rgba(0, 0, 0, 0.65);
  padding: 1px 7px;
  pointer-events: none;
}
.overlay > span.name {
  display: inline-block;
  font-size: 16px;
  font-weight: bold;
  padding: 3px 0px 0px 0px;
  line-height: 1;
}
.overlay > span.name.reference {
  color: rgb(235, 50, 50);
}
.overlay .params {
  font-size: 12px;
}
.overlay .params span.name {
  font-weight: bold;
}
.overlay-bottom {
  display: flex;
  flex-direction: row;
  position: absolute;
  bottom: 0px;
  height: 20px;
  width: 100%;
  background: rgba(255, 255, 255, 0.65);
  border-top: 1px solid rgba(0, 0, 0, 0.65);
  padding: 1px 7px 3px 7px;
  pointer-events: none;
  overflow: hidden;
  white-space:nowrap;
  align-items: center;
}
.overlay-bottom span {
  position: relative;
  display: inline-block;
  top: 1px;
  font-size: 13px;
  line-height: 1;
}
.overlay-bottom span.size {
  font-size: 13px;
}
.overlay-bottom span.tag-resized {
  font-size: 13px;
  color: rgb(220, 0, 0);
  font-weight: bold;
}
.overlay-bottom span.comma {
  font-size: 14px;
  padding-right: 5px;
}
</style>
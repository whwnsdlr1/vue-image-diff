<template>
<div class="body">
  <div class="lamp">
    <div v-show="true"
      class="w-control-panel">
      <button @click="listen__cp__onclick" :disabled="state.numFramesData == 0">Control Panel</button>
    </div>
    <div v-show="options.pan.show" class="pan-x">
      <span>x:</span>
      <input type="number" :value="x" @change="listen__x__onchange" :disabled="state.numFramesData == 0 || options.pan.disabled" />
    </div>
    <div v-show="options.pan.show" class="pan-y">
      <span>y:</span>
      <input type="number" :value="y" @change="listen__y__onchange" :disabled="state.numFramesData == 0 || options.pan.disabled"/>
    </div>
    <div v-show="options.zoom.show" class="zoom">
      <span>zoom:</span>
      <input type="number" min="0.01" :value="zoom" @change="listen__zoom__onchange" :disabled="state.numFramesData == 0 || options.zoom.disabled"/>
    </div>
    <div v-show="options.diff.show">
      <span>diff:</span>
      <input ref="check-diff" type="checkbox" @change="listen__diff_checked__onchange" :disabled="state.numFramesData == 0 || options.diff.disabled" :checked="state.diff.activate == true" />
    </div>
    <div v-show="options.diff.ref.show">
      <span>ref:</span>
      <span class="diff-reference-val"
        :class="{inactive: !state.diff.activate}"
        :title="`${state.diff.reference != undefined ? state.diff.reference.name : ''}`">
        {{ state.diff.reference != undefined ? state.diff.reference.name : '' }}
      </span>
    </div>
    <div v-show="options.diff.tolerance.show">
      <span>tolerance:</span>
      <input ref="input-tolerance" type="range" min="1" max="441.67" v-model="tolerance" :disabled="state.numFramesData == 0 || state.diff.activate == false" />
      <span class="tolerance-val">{{ tolerance }}</span>
    </div>
  </div>
  <div class="icons">
    <img class="btn" src="@/assets/icons/outline_refresh_white_24dp.png" title="reset-state" @click="listen__reset_state__onclick" />
    <img class="btn" src="@/assets/icons/outline_info_white_24dp.png" title="state-information" @click="listen__state_information__onclick" />
    <img class="btn" src="@/assets/icons/outline_help_outline_white_24dp.png" title="help" @click="listen__help__onclick" />
  </div>
</div>
</template>

<script>
/* eslint-disable no-console */
import lodash from 'lodash'
import elementResizeEvent from 'element-resize-event'
import MISC from '@/js/miscellaneous.js'

export default {
  props: [
    'state',
    'options'
  ],
  data: function () {
    return {
      x: undefined,
      y: undefined,
      zoom: undefined,
      tolerance: undefined
    }
  },
  methods: {
    listen__x__onchange: function (e) {
      const val = parseFloat(e.currentTarget.value)
      if (isNaN(val) == false && val != this.state.coord.x) {
        this.$emit('state-tochange', {coord: {x: val, y: this.y}})
      }
    },
    listen__y__onchange: function (e) {
      const val = parseFloat(e.currentTarget.value)
      if (isNaN(val) == false && val != this.state.coord.y) {
        this.$emit('state-tochange', {coord: {x: this.x, y: val}})
      }
    },
    listen__zoom__onchange: function (e) {
      const val = parseFloat(e.currentTarget.value)
      if (isNaN(val) == false && val != this.state.zoom) {
        this.zoom = val
        this.$emit('state-tochange', {zoom: val})
      }
    },
    listen__diff_checked__onchange: function (e) {
      const val = e.target.checked
      if (val != this.state.diff.activate) {
        this.$emit('state-tochange', {diff: {activate: val}})
      }
    },
    listen__cp__onclick: function () {
      function makeBlock (rootDom, title) {
        let dom = MISC.createElement('DIV', {marginBottom: '5px'}, {parent: rootDom})
        MISC.createElement('H4', {margin: '0px', padding: '0px', fontSize: '16px'}, {parent: dom, text: title})
        let contentDom = MISC.createElement('DIV', {paddingLeft: '15px'}, {parent: dom})
        return contentDom
      }

      function makeRow (rootDom, name, dom_params) {
        const styleRowOption = {display: 'flex', flexDirection: 'row', marginBottom: '2px', alignItems: 'center', justifyContent: 'space-between'}
        let row = MISC.createElement('DIV', styleRowOption, {parent: rootDom})
        MISC.createElement('SPAN', {fontSize: '14px'}, {parent: row, text: name})
        for (let dom_param of dom_params) {
          MISC.createElement(dom_param[0], {fontSize: '14px', ...dom_param[1]}, {parent: row, ...dom_param[2]})
        }
      }

      const Vue = this
      const styleInput = {width: '40px', borderRadius: '5px', padding: '0px 0px 0px 3px'}
      let dom = MISC.createElement('DIV', {width: '300px'}, {})
      let contentDom = makeBlock(dom, 'coord')
      makeRow(contentDom, 'x', [['INPUT', styleInput, {attrs: {type: 'number', value: Vue.state.coord.x}}]])
      makeRow(contentDom, 'y', [['INPUT', styleInput, {attrs: {type: 'number', value: Vue.state.coord.y}}]])
      makeRow(dom, 'zoom', [['INPUT', styleInput, {attrs: {type: 'number', value: Vue.state.zoom}}]])

      contentDom = makeBlock(dom, 'voi')
      makeRow(contentDom, 'windowCenter', [['INPUT', styleInput, {attrs: {type: 'number', value: Vue.state.voi.windowCenter}}]])
      makeRow(contentDom, 'windowWidth', [['INPUT', styleInput, {attrs: {type: 'number', value: Vue.state.voi.windowWidth}}]])

      contentDom = makeBlock(dom, 'predefinedImageSize')
      if (Vue.state.numFramesData == 0) {
        makeRow(contentDom, 'width', [['INPUT', styleInput, {attrs: {type: 'number', min: 1, value: Vue.state.predefinedImageSize.width}}]])
        makeRow(contentDom, 'height', [['INPUT', styleInput, {attrs: {type: 'number', min: 1, value: Vue.state.predefinedImageSize.height}}]])
      } else {
        const predefinedImageSizeWidth = Vue.state.predefinedImageSize.width != undefined ? `${Vue.state.predefinedImageSize.width}` : 'undefined'
        const predefinedImageSizeHeight = Vue.state.predefinedImageSize.height != undefined ? `${Vue.state.predefinedImageSize.height}` : 'undefined'
        makeRow(contentDom, 'width', [['SPAN', {}, {text: predefinedImageSizeWidth}]])
        makeRow(contentDom, 'height', [['SPAN', {}, {text: predefinedImageSizeHeight}]])
      }

      contentDom = makeBlock(dom, 'diff')
      makeRow(contentDom, 'activate', [['INPUT', {}, {attrs: {type: 'checkbox', checked: Vue.state.diff.checked}}]])
      makeRow(contentDom, 'tolerance', [['INPUT', styleInput, {attrs: {type: 'number', min: 1, max: 441, value: Vue.state.diff.tolerance}}]])
      makeRow(contentDom, 'opacity', [['INPUT', styleInput, {attrs: {type: 'number', min: 0, max: 1, value: Vue.state.diff.opacity}}]])
      let contentDom1 = makeBlock(contentDom, 'colors')
      makeRow(contentDom1, 'same', [['INPUT', {...styleInput, width: '65px'}, {attrs: {type: 'text', value: MISC.convertRgbToHex(...Vue.state.diff.colors.same)}}]])
      makeRow(contentDom1, 'diff', [['INPUT', {...styleInput, width: '65px'}, {attrs: {type: 'text', value: MISC.convertRgbToHex(...Vue.state.diff.colors.diff)}}]])

      contentDom = makeBlock(dom, 'style')
      makeRow(contentDom, 'borderWidth', [['INPUT', styleInput, {attrs: {type: 'number', min: 1, value: Vue.state.style.borderWidth}}]])
      makeRow(contentDom, 'borderColor', [['INPUT', {...styleInput, width: '65px'}, {attrs: {type: 'text', value: MISC.convertRgbToHex(...Vue.state.style.borderColor)}}]])
      makeRow(contentDom, 'showOverlayText', [['INPUT', {}, {attrs: {type: 'checkbox', checked: Vue.state.style.showOverlayText}}]])
      makeRow(contentDom, 'frameRowCount', [['INPUT', styleInput, {attrs: {type: 'number', min: 1, value: Vue.state.style.frameRowCount}}]])
      
      Vue.$mModal.show('dialog', {
        dom: dom,
        buttons: [
          {
            title: 'cancel',
            onclick: () => {}
          },
          {
            title: 'confirm',
            class: ['green'],
            onclick: () => {
              Vue.$emit('state-tochange', {})
            }
          }
        ]
      })
    },
    listen__reset_state__onclick: function () {
      this.$emit('state-toreset', {})
    },
    listen__state_information__onclick: function () {
      const styleKey = {fontSize: '14px', lineHeight: 1.5, fontWeight: 'bold', paddingRight: '5px', color: 'rgb(4, 81, 173)'}
      const styleValue = {fontSize: '14px', lineHeight: 1.5}
      function putValue (parent, tab, key, value, type = "string") {
        const tabSize = `${tab * 15}px`
        let valueColor = 'rgb(184, 21, 21)'
        switch(type) {
          case 'number':
            valueColor = 'rgb(9, 136, 90)'
            break
          case 'boolean':
            valueColor = 'rgb(0, 0, 255)'
            break
          case 'parentheses':
            valueColor = 'rgb(0, 128, 0)'
            break
        }
        let div = MISC.createElement('DIV', {}, {parent})
        MISC.createElement('SPAN', {paddingLeft: tabSize}, {parent: div, text: ``})
        if (key != null)
          MISC.createElement('SPAN', {...styleKey}, {parent: div, text: `${key}:`})
        MISC.createElement('SPAN', {...styleValue, color: valueColor}, {parent: div, text: `${value}`})
      }
      const Vue = this
      const state = Vue.state
      let dom = MISC.createElement('DIV', {}, {})
      MISC.createElement('H3', {fontSize: '20px', marginBottom: '0px', marginTop: '5px'}, {parent: dom, text: 'State'})
      MISC.createElement('HR', {}, {parent: dom})
      putValue(dom, 0, 'coord', '{', 'parentheses')
      putValue(dom, 1, 'x', state.coord.x != undefined ? state.coord.x.toFixed(2) : state.coord.x, 'number')
      putValue(dom, 1, 'y', state.coord.y != undefined ? state.coord.y.toFixed(2) : state.coord.y, 'number')
      putValue(dom, 0, null, '}', 'parentheses')
      putValue(dom, 0, 'voi', '{', 'parentheses')
      putValue(dom, 1, 'windowCenter', state.voi.windowCenter.toFixed(2), 'number')
      putValue(dom, 1, 'windowWidth', state.voi.windowWidth.toFixed(2), 'number')
      putValue(dom, 0, null, '}', 'parentheses')
      putValue(dom, 0, 'predefinedImageSize', '{', 'parentheses')
      putValue(dom, 1, 'width', state.predefinedImageSize.width != undefined ? state.predefinedImageSize.width : -1, 'number')
      putValue(dom, 1, 'height', state.predefinedImageSize.height != undefined ? state.predefinedImageSize.height : -1, 'number')
      putValue(dom, 0, null, '}', 'parentheses')
      putValue(dom, 0, 'diff', '{', 'parentheses')
      putValue(dom, 1, 'activate', state.diff.activate, 'boolean')
      putValue(dom, 1, 'reference', '{', 'parentheses')
      putValue(dom, 2, 'id', state.diff.reference.id, 'string')
      putValue(dom, 1, null, '}', 'parentheses')
      putValue(dom, 1, 'colors', '{', 'parentheses')
      putValue(dom, 2, 'diff', state.diff.colors.diff, 'number')
      putValue(dom, 2, 'same', state.diff.colors.same, 'number')
      putValue(dom, 1, null, '}', 'parentheses')
      putValue(dom, 0, null, '}', 'parentheses')
      putValue(dom, 0, 'style', '{', 'parentheses')
      putValue(dom, 1, 'borderWidth', state.style.borderWidth, 'number')
      putValue(dom, 1, 'borderColor', state.style.borderColor, 'number')
      putValue(dom, 1, 'showOverlayText', state.style.showOverlayText, 'boolean')
      putValue(dom, 1, 'frameRowCount', state.style.frameRowCount, 'number')
      putValue(dom, 0, null, '}', 'parentheses')
      Vue.$mModal.show('dialog', {
        dom: dom,
        buttons: [
          {
            title: 'confirm',
            class: ['green'],
            onclick: () => {
            }
          }
        ],
        onafterdomattached: (dDom) => {
          dDom.parentElement.style.maxHeight = `${parseInt(window.innerHeight * 0.5)}px`
          dDom.parentElement.style.overflow = 'auto'
        }
      })
    },
    listen__help__onclick: function () {
      const Vue = this
      let dom = MISC.createElement('DIV', {}, {})
      MISC.createElement('H3', {fontSize: '20px', marginBottom: '0px', marginTop: '5px'}, {parent: dom, text: 'Control'})
      MISC.createElement('HR', {}, {parent: dom})
      const styleSpan = {fontSize: '14px', lineHeight: 1.5}
      let data = {
        Pan: 'PC - left mouse drag / Mobile - touch drag',
        Zoom: 'PC - middle mouse, or mousewheel / Mobile - two-finger spread or squish',
        'Adjust Brightness': 'right mouse drag along a vertical axis',
        'Adjust Contrast': 'right mouse drag along a horizontal axis'
      }
      for (let key in data) {
        let div = MISC.createElement('DIV', {}, {parent: dom})
        MISC.createElement('SPAN', {...styleSpan, fontWeight: 'bold', paddingRight: '10px'}, {parent: div, text: `${key}:`})
        MISC.createElement('SPAN', styleSpan, {parent: div, text: data[key]})
      }
      MISC.createElement('H3', {fontSize: '20px', marginTop: '20px', marginBottom: '0px'}, {parent: dom, text: process.env.name})
      MISC.createElement('HR', {}, {parent: dom})
      data = [
        {head: 'version', type: 'span', text: process.env.PACKAGE_VERSION},
        {head: 'github', type: 'a', text: process.env.homepage},
        {head: 'issues', type: 'a', text: process.env.issuesUrl}
      ]
      for (let el of data) {
        let div = MISC.createElement('DIV', {}, {parent: dom})
        MISC.createElement('SPAN', {...styleSpan, fontWeight: 'bold', paddingRight: '10px'}, {parent: div, text: `${el.head}:`})
        if (el.type == 'span')
          MISC.createElement('SPAN', styleSpan, {parent: div, text: el.text})
        else if (el.type == 'a')
          MISC.createElement('A', styleSpan, {parent: div, text: el.text, attrs: {href: el.text}})
        else if (el.type == 'mail')
          MISC.createElement('A', styleSpan, {parent: div, text: el.text, attrs: {href: `mailto:${el.text}`}})
      }
      Vue.$mModal.show('dialog', {
        dom: dom,
        buttons: [
          {
            title: 'confirm',
            class: ['green'],
            onclick: () => {
            }
          }
        ]
      })
    }
  },
  watch: {
    'state.coord': function (coord) {
      if (coord.x != undefined && coord.y != undefined) {
        this.x = parseFloat(coord.x.toFixed(2))
        this.y = parseFloat(coord.y.toFixed(2))
      } else {
        this.x = this.y = undefined
      }
    },
    "state.zoom": function (zoom) {
      if (zoom != undefined) this.zoom = parseFloat(zoom.toFixed(2))
      else this.zoom = undefined
    }
  },
  mounted () {
    const Vue = this
    Vue.tolerance = Vue.state.diff.tolerance
    
    Vue.$refs['input-tolerance'].onchange = lodash.debounce(function () {
      Vue.$emit('state-tochange', {diff: {tolerance: Vue.tolerance}})
    }, 100)
    const lamp__onresize = () => {
      const elLamp = this.$el.querySelector('.lamp')
      if (elLamp.clientWidth < elLamp.scrollWidth) {
        elLamp.querySelectorAll('div:not(.w-control-panel)').forEach(el => el.style.visibility = 'hidden')
        elLamp.querySelectorAll('div.w-control-panel').forEach(el => el.style.visibility = 'visible')
      } else {
        elLamp.querySelectorAll('div:not(.w-control-panel)').forEach(el => el.style.visibility = 'visible')
        elLamp.querySelectorAll('div.w-control-panel').forEach(el => el.style.visibility = 'hidden')
      }
    }
    elementResizeEvent(this.$el.querySelector('.lamp'), lodash.debounce(lamp__onresize, 10))
    lamp__onresize()
  },
  beforeDestroy () {
    elementResizeEvent.unbind(this.$el.querySelector('.lamp'))
  }
}
</script>

<style scoped>
div.body {
  display: flex;
  flex-direction: row;
  flex: 0 0 35px;
  background: rgb(36, 41, 46);
  align-items: center;
  padding: 0px 20px;
  border-bottom: 1px solid rgb(80, 80, 80);
}
div.body * {
  -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
      -moz-user-select: none; /* Firefox */
      -ms-user-select: none; /* Internet Explorer/Edge */
          user-select: none; /* Non-prefixed version, currently
                                supported by Chrome and Opera */
}
div.lamp {
  display: flex;
  flex-direction: row;
  height: 100%;
  flex: 1 0 0;
  justify-content: center;
  align-items: center;
  overflow:hidden;
}
div.lamp > div {
  display: inline-block;
  white-space: nowrap;
}
div.lamp > div:not(:last-of-type) {
  margin-right: 15px;
}
div.lamp span:first-child {
  font-size: 14px;
  font-weight: bold;
  color: rgb(230, 230, 230);
  margin-right: 5px;
}
div.lamp span.diff-reference-val {
  display: inline-block;
  max-width: 90px;
  font-size: 12px;
  color: rgb(230, 230, 230);
  overflow-x: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
}
div.lamp span.diff-reference-val.inactive {
  color: rgb(130, 130, 130);
}
div.lamp span.tolerance-val {
  display: inline-block;
  width: 25px;
  font-size: 12px;
  color: rgb(230, 230, 230);
  margin-left: 5px;
}
div.lamp .w-control-panel {
  position: absolute;
  display: flex;
  flex-direction: row;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  padding: 6px 0px;
  justify-content: center;
}
div.lamp input {
  width: 40px;
  border-radius: 5px;
  padding: 0px 0px 0px 3px;
}
div.lamp input[type=checkbox] {
  position: relative;
  top: 2px;
  width: 15px;
  padding: 0px 0px 0px 0px;
  margin: 0px 0px 0px 0px;
}
div.lamp input[type=range] {
  position: relative;
  bottom: 1px;
  width: 100px;
  height: 6px;
  padding: 0px 0px 0px 0px;
  margin: 0px 0px 0px 0px;
  -webkit-appearance: none;
  border-radius: 3px;
  border: 1px solid rgb(180, 180, 180);
  background: #d3d3d3;
  outline: none;
  opacity: 0.7;
  -webkit-transition: .2s;
  transition: opacity .2s;
  box-sizing: border-box;
}
div.lamp input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 8px;
  height: 15px;
  background: rgb(0, 123, 255);
  border: 1px solid rgb(255, 255, 255);
  cursor: pointer;
}
div.lamp input[type=range][disabled]::-webkit-slider-thumb {
  background: rgb(80, 80, 80);
  cursor: default;
}
div.lamp input[type=range]::-moz-range-thumb {
  width: 8px;
  height: 15px;
  background: rgb(0, 123, 255);
  border: 1px solid rgb(255, 255, 255);
  cursor: pointer;
}
div.lamp input[type=range][disabled]::-moz-range-thumb {
  background: rgb(80, 80, 80);
  cursor: default;
}

div.icons {
  display: flex;
  flex-direction: row;
  align-items: center;
}
div.icons img.btn {
  cursor: pointer;
  width: 20px;
  height: 20px;
  padding: 1px;
  border-radius: 3px;
  border: 1px solid rgb(36, 41, 46);
}
div.icons img.btn:hover {
  background: rgb(80, 80, 80);
  border: 1px solid rgb(150, 150, 150);
}
div.icons img.btn:not(:last-of-type) {
  margin-right: 1px;
}
</style>

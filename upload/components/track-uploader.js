/* global FormData, FileReader, XMLHttpRequest */

const Component = require('choo/component')
const html = require('choo/html')
const nanostate = require('nanostate')
const validateFormdata = require('validate-formdata')
const ProgressBar = require('./progress-bar')

const MAX_FILE_SIZE_AIFF = 52428800 // 50MB

class TrackUploader extends Component {
  constructor (id, state, emit) {
    super(id)

    this.local = state.components[id] = {}
    this.state = state
    this.emit = emit

    this.local.progress = 0
    this.formats = ['audio/mp4']

    this.onDragOver = this.onDragOver.bind(this)
    this.onDragleave = this.onDragleave.bind(this)
    this.onChange = this.onChange.bind(this)

    this.machine = nanostate('idle', {
      idle: { drag: 'dragging', resolve: 'data' },
      dragging: { resolve: 'data', drag: 'idle' },
      data: { drag: 'dragging', resolve: 'data', reject: 'error' },
      error: { drag: 'idle', resolve: 'data' }
    })

    this.validator = validateFormdata()
    this.form = this.validator.state
  }

  createElement (props) {
    this.validator = props.validator || this.validator
    this.required = props.required
    this.form = props.form || this.form || {
      changed: false,
      valid: true,
      pristine: {},
      required: {},
      values: {},
      errors: {}
    }

    this.progressBar = this.state.cache(ProgressBar, 'progress-upload')

    const errors = this.form.errors

    this.multiple = props.multiple || false
    this.accept = props.accept || 'image/jpeg,image/jpg,image/png,video/mp4,audio/mpeg,audio/mp3,audio/flac,audio/mp4,audio/ogg,.jpg,.jpeg,.png,.mp4,.mp3,.flac,.wav'
    this.direction = props.direction || 'row'
    this.ratio = props.ratio || '1600x900px'

    const dropInfo = {
      idle: 'Drop an audio file',
      dragging: 'Drop now!',
      error: 'File not supported',
      data: 'Fetch Again?'
    }[this.machine.state]

    return html`
      <div class="flex flex-${this.direction} ${this.machine.state === 'dragging' ? 'dragging' : ''}" unresolved>
        <div class="dropzone absolute" style="z-index:-1;" ondragover=${this.onDragOver} ondrop=${this.onDrop} ondragleave=${this.onDragleave}>
          <input id="inputFile-${this._name}" required=${this.required} class="input-file ${this.image ? 'loaded' : 'empty'}" name="inputFile-${this._name}" onchange=${this.onChange} title=${dropInfo} accept=${this.accept} type="file" />
          <label for=${this._name}>Upload</label>
        </div>
        <div ondragover=${this.onDragOver} ondrop=${this.onDrop} ondragleave=${this.onDragleave} class="flex ${this.direction === 'row' ? 'ml3' : 'mt3'} flex-${this.direction === 'column' ? 'row' : 'column'}">
          <div class="relative grow">
            <input required=${this.required} class="input-file ${this.image ? 'loaded' : 'empty'}" name="inputFile-${this._name}" onchange=${this.onChange} title=${dropInfo} accept=${this.accept} type="file" id=${this._name + '-button'} />
            <label class="dib pv2 ph4 mb1 ba bw1 b--black-80 ${this.direction === 'column' ? 'mr2' : ''}" for=${this._name + '-button'}>Upload</label>
          </div>
          <p class="ma0 pa0 message warning">${errors[`inputFile-${this._name}`] ? errors[`inputFile-${this._name}`].message : ''}</p>
          <div class="flex flex-column mt2">
            ${this.progressBar.render({ progress: this.local.progress })}
          </div>
        </div>
      </div>
    `
  }

  uploadFile (url, opts = {}, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', onProgress)
      xhr.upload.addEventListener('loadend', () => {
        console.log('Ended')
      })

      xhr.open(opts.method || 'POST', url, true)
      xhr.withCredentials = true

      for (const k in opts.headers || {}) {
        xhr.setRequestHeader(k, opts.headers[k])
      }

      xhr.onload = e => {
        resolve(e.target.responseText)
      }

      xhr.onerror = reject

      xhr.send(opts.body)
    })
  }

  onDragOver (e) {
    e.preventDefault()
    e.stopPropagation()
    if (this.machine.state === 'dragging') return false
    this.machine.emit('drag')

    this.rerender()
  }

  onDragleave (e) {
    e.preventDefault()
    e.stopPropagation()
    console.log('dragleave')
    this.machine.emit('drag')
    this.rerender()
  }

  onDrop (e) {
    console.log(e)
  }

  onChange (e) {
    e.preventDefault()
    e.stopPropagation()

    this.machine.emit('resolve')

    const files = e.target.files

    for (const file of files) {
      const reader = new FileReader()
      const size = file.size

      const audio = ((/audio\/mpeg|audio\/mp3|audio\/flac|audio\/mp4|audio\/ogg|audio\/x+|wav/).test(file.type))

      if (!audio) {
        this.machine.emit('reject')
        return this.rerender()
      }

      if (audio) {
        switch (file.type) {
          case 'audio/wav':
          case 'audio/flac':
          case 'audio/aiff':
            if (size < MAX_FILE_SIZE_AIFF) {
              this.machine.emit('reject')
              return this.rerender()
            }
            break
          default:
            console.log('do stuff')
        }

        reader.onload = async (e) => {
          const formData = new FormData()
          formData.append('uploads', file)

          const onProgress = (event) => {
            if (event.lengthComputable) {
              const progress = event.loaded / event.total * 100
              this.local.progress = progress
              this.progressBar.slider.update({
                value: this.local.progress
              })
            } else {
              console.log('unable to compute')
              // Unable to compute progress information since the total size is unknown
            }
          }

          await this.uploadFile('/api/upload', { body: formData }, onProgress)

          console.log('Done uploading')
        }

        reader.readAsDataURL(file)
      }
    }
  }

  beforerender (el) {
    el.removeAttribute('unresolved')
  }

  afterupdate (el) {
    el.removeAttribute('unresolved')
  }

  load (el) {
    if (this.multiple) {
      const input = el.querySelector('input[type="file"]')
      input.attr('multiple', 'true')
    }
  }

  update () {
    return false
  }
}

module.exports = TrackUploader

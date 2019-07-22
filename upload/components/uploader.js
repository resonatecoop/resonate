const Component = require('choo/component')
const html = require('choo/html')
const nanostate = require('nanostate')
const validateFormdata = require('validate-formdata')

const MAX_FILE_SIZE_IMAGE = 5242880 // 5MB
const MAX_FILE_SIZE_AIFF = 52428800 // 50MB

class Uploader extends Component {
  constructor (name, state, emit) {
    super(name)

    this.name = name
    this.artwork = ''
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
        <div class="w-100">
          <div class="preview flex relative" style="padding-top:calc(${props.format.height / props.format.width} * 100%);">
            <div style="background: url(${this.image}) center center / cover no-repeat;" class="upload absolute top-0 w-100 h-100 flex-auto">
              <div class="relative dropzone" ondragover=${this.onDragOver} ondrop=${this.onDrop} ondragleave=${this.onDragleave}>
                <input id="inputFile-${this.name}" required=${this.required} class="input-file ${this.image ? 'loaded' : 'empty'}" name="inputFile-${this.name}" onchange=${this.onChange} title=${dropInfo} accept=${this.accept} type="file" />
                <label for=${this.name}>Upload</label>
              </div>
            </div>
          </div>
        </div>
        <div ondragover=${this.onDragOver} ondrop=${this.onDrop} ondragleave=${this.onDragleave} class="flex ${this.direction === 'row' ? 'ml3' : 'mt3'} flex-${this.direction === 'column' ? 'row' : 'column'}">
          <div class="relative grow">
            <input required=${this.required} class="input-file ${this.image ? 'loaded' : 'empty'}" name="inputFile-${this.name}" onchange=${this.onChange} title=${dropInfo} accept=${this.accept} type="file" id=${this.name + '-button'} />
            <label class="dib pv2 ph4 mb1 ba bw1 b--black-80 ${this.direction === 'column' ? 'mr2' : ''}" for=${this.name + '-button'}>Upload</label>
          </div>
          <p class="ma0 pa0 message warning">${errors[`inputFile-${this.name}`] ? errors[`inputFile-${this.name}`].message : ''}</p>
          <p class="lh-copy ma0 pa0 f6 grey">For best results, upload a JPG or PNG at ${this.ratio}</p>
        </div>
      </div>
    `
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

    for (let file of files) {
      const reader = new window.FileReader()
      const size = file.size
      const type = file.type

      const image = ((/(image\/gif|image\/jpg|image\/jpeg|svg|image\/webp|image\/png)/).test(file.type))
      const music = ((/audio\/mpeg|audio\/mp3|audio\/flac|audio\/mp4|audio\/ogg|audio\/x+|wav/).test(file.type))
      // const video = ((/video\/mp4/).test(file.type))

      if (!image && !music) {
        this.machine.emit('reject')
        return this.rerender()
      }

      if (image) {
        switch (type) {
          case 'image/jpg':
          case 'image/jpeg':
          case 'image/png':
          case 'image/gif':
            break
          default:
            this.machine.emit('reject')
            return this.rerender()
        }

        if (size > MAX_FILE_SIZE_IMAGE) {
          this.machine.emit('reject')
          return this.rerender()
        }

        // Load some artwork
        const blob = new window.Blob([file], {
          'type': file.type
        })

        reader.onload = e => {
          const base64FileData = reader.result.toString()
          this.image = base64FileData
          const image = new window.Image()
          image.src = base64FileData
          image.onload = () => {
            this.width = image.width
            this.height = image.height
            this.validator.validate(`inputFile-${this.name}`, { width: this.width, height: this.height })
            this.rerender()
          }
          this.rerender()
        }

        reader.readAsDataURL(blob)
      }

      if (music) {
        switch (type) {
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

        reader.onload = (e) => {
          this.src = e.target.result

          this.rerender()

          /*

          const formData = new window.FormData()
          formData.append('myFile', file)

          const options = {
            method: 'POST',
            url: `/api`,
            body: formData
          }

          xhr(options, (err, res, body) => {
            if (err) { return }
            const json = JSON.parse(body)
            const tags = json.data.format.tags
            state.tags = tags
          })
          */
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
    this.validator.field(`inputFile-${this.name}`, { required: this.required }, (data) => {
      if (typeof data === 'object') {
        const { width, height } = data
        console.log(data)
        if (!width || !height) return new Error('Image is required')
        if (width < 1500 && height < 900) {
          return new Error('Image size is too small')
        }
      }
    })
  }

  update () {
    return false
  }
}

module.exports = Uploader

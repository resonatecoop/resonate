const raw = require('choo/html/raw')
const html = require('choo/html')
const Albums = require('../../components/albums')
const Artists = require('../../components/artists')
const ProfileHeader = require('../../components/profile-header')
const ProfileHeaderImage = require('../../components/profile-header/image')
const icon = require('@resonate/icon-element')
const Links = require('../../components/links')
const viewLayout = require('../../elements/view-layout')
const renderTotal = require('../../elements/total')

module.exports = LabelView

function LabelView () {
  return (state, emit) => {
    return viewLayout((state, emit) => {
      return html`
        <section id="label-profile" class="flex flex-column flex-auto w-100">
          ${renderHeader(state)}
          ${renderContent(state)}
        </section>
      `
    })(state, emit)

    function renderHeader (state) {
      const profileHeader = state.cache(ProfileHeader, 'profile-header')

      return html`
        <section id="label-header" class="w-100">
          ${renderProfileHeaderImage(state)}
          ${profileHeader.render({
            data: state.label.data || {}
          })}
        </section>
      `

      function renderProfileHeaderImage (state) {
        if (!state.label.data) return

        const id = Number(state.params.uid)
        const image = state.label.data.avatar || {}

        if (!image.cover) return

        const profileHeaderImage = state.cache(ProfileHeaderImage, `profile-header-image-${id}`)

        return profileHeaderImage.render({
          cover: image.cover
        })
      }
    }

    function renderContent (state) {
      let placeholder
      let artists
      let albums
      let bio

      if (state.label.notFound) {
        placeholder = renderPlaceholder('Resource not found')
      } else {
        if (state.label.artists.items.length) {
          artists = renderArtists(state)
        }

        if (state.label.albums.items.length) {
          albums = renderAlbums(state)
        }

        if (state.label.data && state.label.data.description) {
          bio = renderBio(state)
        }
      }

      return html`
        <section id="content" class="flex flex-column flex-auto w-100 pb7">
          ${placeholder}
          ${artists}
          ${albums}
          ${bio}
        </section>
      `
    }

    function renderBio (state) {
      const id = Number(state.params.uid)
      const { name, description: body } = state.label.data

      return html`
        <section id="bio" class="flex-auto mh3">
          <h3 class="f4 fw3">Bio</h3>
          <div class="flex flex-column flex-row-ns">
            <article class="w-100 mw6">
              ${body ? raw(body) : html`<span class="dark-gray">${name} has not provided a biography yet.</span>`}
            </article>
            <aside id="links" class="ml4-ns">
              ${state.cache(Links, `links-${id}`).render({ uid: id, type: 'labels' })}
            </aside>
          </div>
        </section>
      `
    }

    function renderPlaceholder (message) {
      return html`
        <div class="flex justify-center items-center mt3">
          ${icon('info', { class: 'icon icon--sm fill-current-color' })}
          <p class="lh-copy pl3">${message}</p>
        </div>
      `
    }

    function renderArtists (state) {
      const id = Number(state.params.uid)
      const { items = [], numberOfPages, count = 0 } = state.label.artists
      const artists = state.cache(Artists, 'label-artists-' + id).render({
        items,
        numberOfPages,
        pagination: numberOfPages > 1
      })

      return html`
        <section id="label-artists" class="flex-auto">
          <div class="flex">
            <h3 class="lh-title fw3 relative ml3">
              Artists
              ${renderTotal(count)}
            </h3>
          </div>
          ${artists}
        </section>
      `
    }

    function renderAlbums (state) {
      const { items = [], numberOfPages = 1, count } = state.label.albums
      const id = Number(state.params.uid)
      const albums = state.cache(Albums, 'label-albums-' + id).render({
        items,
        numberOfPages,
        pagination: numberOfPages > 1
      })

      return html`
        <section id="label-albums" class="flex-auto mh3 mt4">
          <div class="flex">
            <h3 class="fw3 lh-title relative">
              Albums
              ${renderTotal(count)}
            </h3>
          </div>
          ${albums}
        </section>
      `
    }
  }
}

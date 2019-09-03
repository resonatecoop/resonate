const raw = require('choo/html/raw')
const html = require('choo/html')
const Albums = require('../../components/albums')
const Artists = require('../../components/artists')
const ProfileHeader = require('../../components/profile-header')
const ProfileHeaderImage = require('../../components/profile-header/image')
const socialLinks = require('../../elements/social-buttons')
const viewLayout = require('../../elements/view-layout')

module.exports = LabelView

function LabelView () {
  return (state, emit) => {
    return viewLayout((state, emit) => {
      return html`
        <section id="label-profile" class="flex flex-column flex-auto w-100">
          ${renderHeader(state)}
          <section id="content" class="flex flex-column flex-auto w-100 pb6">
            ${state.label.artists.items.length ? renderArtists(state) : ''}
            ${state.label.albums.items.length ? renderAlbums(state) : ''}
            ${state.label.data.description ? renderBio(state) : ''}
          </section>
        </section>
      `
    })(state, emit)

    function renderHeader (state) {
      const id = parseInt(state.params.uid, 10)
      const profileHeader = state.cache(ProfileHeader, 'profile-header').render({
        data: state.label.data
      })

      const image = state.label.data.avatar || {}
      const profileHeaderImage = state.cache(ProfileHeaderImage, `profile-header-image-${id}`).render({
        cover: image.cover
      })

      return html`
        <section id="label-header" class="w-100">
          ${profileHeaderImage}
          ${profileHeader}
        </section>
      `
    }

    function renderBio (state) {
      const { name, description: body, links = [] } = state.label.data

      return html`
        <section id="bio" class="flex-auto mh3">
          <h4 class="f4">Bio</h4>
          <div class="flex flex-column flex-row-ns">
            <article class="w-100 mw6">
              ${body ? raw(body) : html`<span class="dark-gray">${name} has not provided a biography yet.</span>`}
            </article>
            <aside id="links" class="ml3-ns mt2">
              ${socialLinks(links)}
            </aside>
          </div>
        </section>
      `
    }

    function renderArtists (state) {
      const id = parseInt(state.params.uid, 10)
      const { items = [], numberOfPages } = state.label.artists
      const artists = state.cache(Artists, 'label-artists-' + id).render({
        items,
        numberOfPages,
        pagination: numberOfPages > 1
      })

      return html`
        <section id="label-artists" class="flex-auto">
          <h2 class="lh-title ml3">Artists</h2>
          ${artists}
        </section>
      `
    }

    function renderAlbums (state) {
      const { items = [], numberOfPages = 1 } = state.label.albums
      const id = parseInt(state.params.uid, 10)
      const albums = state.cache(Albums, 'label-albums-' + id).render({
        items,
        numberOfPages,
        pagination: numberOfPages > 1
      })

      return html`
        <section id="label-albums" class="flex-auto mh3 mt4">
          <h2 class="lh-title">Albums</h2>
          ${albums}
        </section>
      `
    }
  }
}

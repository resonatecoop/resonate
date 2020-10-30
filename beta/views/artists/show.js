const { isNode } = require('browser-or-node')
const raw = require('choo/html/raw')
const html = require('choo/html')
const icon = require('@resonate/icon-element')
const Albums = require('../../components/albums')
const Playlist = require('@resonate/playlist-component')
const ProfileHeader = require('../../components/profile-header')
const ProfileHeaderImage = require('../../components/profile-header/image')
const LabelItem = require('../../components/labels/item')
const Links = require('../../components/links')
const viewLayout = require('../../elements/view-layout')
const renderTotal = require('../../elements/total')

module.exports = ArtistView

function ArtistView () {
  return (state, emit) => {
    const id = Number(state.params.uid)
    if (isNaN(id)) return emit(state.events.PUSHSTATE, '/')
    if (isNode) emit('prefetch:artist', id)

    return viewLayout((state, emit) => {
      return html`
        <section id="artist-profile" class="flex flex-column flex-auto w-100">
          ${renderHeader(state)}
          ${renderContent(state)}
        </section>
      `
    })(state, emit)

    function renderContent (state) {
      let placeholder
      let topTracks
      let tracks
      let latestRelease
      let albums
      let bio
      let memberOf

      if (state.artist.notFound) {
        placeholder = renderPlaceholder('Resource not found')
      } else {
        if (state.artist.topTracks.items.length) {
          topTracks = renderTopTracks(state)
        }

        if (!state.artist.topTracks.items.length && state.artist.tracks.length) {
          tracks = renderTracks(state)
        }

        if (state.artist.latestRelease.items.length) {
          latestRelease = renderLatestRelease(state)
        }

        if (state.artist.albums.items.length) {
          albums = renderAlbums(state)
        }

        if (state.artist.data && state.artist.data.description) {
          bio = renderBio(state)
        }

        if (state.artist.label && state.artist.label.data) {
          memberOf = renderMemberOf(state)
        }
      }

      return html`
        <section id="content" class="flex flex-column flex-auto w-100 pb7 ph3">
          ${placeholder}
          <div class="flex flex-column" style=${!state.artist.notFound ? 'min-height:100vh' : ''}>
            ${topTracks}
            ${tracks}
            ${latestRelease}
            ${albums}
          </div>
          ${bio}
          ${memberOf}
        </section>
      `
    }

    function renderHeader (state) {
      const profileHeader = state.cache(ProfileHeader, 'profile-header')

      return html`
        <section id="artist-header" class="w-100">
          ${renderProfileHeaderImage(state)}
          ${profileHeader.render({
            data: state.artist.data || {}
          })}
        </section>
      `

      function renderProfileHeaderImage (state) {
        if (!state.artist.data) return

        const id = Number(state.params.uid)
        const image = state.artist.data.avatar || {}

        if (!image.cover) return

        const profileHeaderImage = state.cache(ProfileHeaderImage, `profile-header-image-${id}`)

        return profileHeaderImage.render({
          cover: image.cover,
          name: state.artist.data.name
        })
      }
    }

    function renderTracks (state) {
      const id = Number(state.params.uid)
      const playlist = state.cache(Playlist, `playlist-artist-${id}`).render({
        type: 'tracks',
        playlist: state.artist.tracks || []
      })
      return html`
        <section id="artist-playlist" class="flex-auto">
          <h3 class="lh-title">Tracks</h3>
          ${playlist}
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

    function renderTopTracks (state) {
      const id = Number(state.params.uid)
      const playlist = state.cache(Playlist, `playlist-artist-top-${id}`).render({
        type: 'tracks',
        playlist: state.artist.topTracks.items || []
      })
      return html`
        <section id="artist-playlist" class="flex-auto">
          <h3 class="fw3 lh-title">Top tracks</h3>
          ${playlist}
        </section>
      `
    }

    function renderLatestRelease (state) {
      const { items = [] } = state.artist.latestRelease
      const id = Number(state.params.uid)
      const albums = state.cache(Albums, 'artist-albums-latest-' + id)

      return html`
        <section id="artist-latest-release" class="flex-auto">
          <h3 class="fw3 lh-title">Latest release</h3>
          <div>
            ${albums.render({
              items,
              pagination: false
            })}
          </div>
        </section>
      `
    }

    function renderAlbums (state) {
      const { items = [], numberOfPages = 1, count } = state.artist.albums
      const id = Number(state.params.uid)
      const albums = state.cache(Albums, 'artist-albums-' + id)

      return html`
        <section id="artist-albums" class="flex-auto">
          <div class="flex">
            <h3 class="fw3 relative lh-title">
              All releases
              ${renderTotal(count)}
            </h3>
          </div>
          <div>
            ${albums.render({
              items,
              numberOfPages: numberOfPages,
              pagination: numberOfPages > 1
            })}
          </div>
        </section>
      `
    }

    function renderBio (state) {
      const id = Number(state.params.uid)
      const { description: body } = state.artist.data

      return html`
        <section id="bio" class="flex-auto">
          <h3 class="fw3 f4 lh-title">Bio</h3>
          <div class="flex flex-column flex-row-ns">
            <article class="w-100 mb4 mw6">
              ${raw(body)}
            </article>
            <aside id="links" class="ml4-ns">
              ${state.cache(Links, `links-${id}`).render({ uid: id })}
            </aside>
          </div>
        </section>
      `
    }

    function renderMemberOf (state) {
      const id = Number(state.params.uid)
      const label = state.artist.label.data

      return html`
        <section id="members" class="flex-auto">
          <h3 class="fw3 f4 lh-title">Member of</h3>

          <div class="mw5">
            ${state.cache(LabelItem, `labels-${id}`, state, emit).render(label)}
          </div>
        </section>
      `
    }
  }
}

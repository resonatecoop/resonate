const raw = require('choo/html/raw')
const html = require('choo/html')
const Albums = require('../../components/albums')
const Playlist = require('@resonate/playlist-component')
const ProfileHeader = require('../../components/profile-header')
const ProfileHeaderImage = require('../../components/profile-header/image')
const Labels = require('../../components/labels')
const Links = require('../../components/links')
const viewLayout = require('../../elements/view-layout')

module.exports = ArtistView

function ArtistView () {
  return (state, emit) => {
    const id = parseInt(state.params.uid, 10)
    if (isNaN(id)) return emit(state.events.PUSHSTATE, '/')

    return viewLayout((state, emit) => html`
      <section id="artist-profile" class="flex flex-column flex-auto w-100">
        ${renderHeader(state)}
        <section id="content" class="flex flex-column flex-auto w-100 pb6 ph3">
          ${state.artist.topTracks.length ? renderTopTracks(state) : ''}
          ${!state.artist.topTracks.length && state.artist.tracks.length ? renderTracks(state) : ''}
          ${state.artist.latestRelease.items.length ? renderLatestRelease(state) : ''}
          ${state.artist.albums.items.length ? renderAlbums(state) : ''}
          ${state.artist.data.description ? renderBio(state) : ''}
          ${state.artist.data.label ? renderMemberOf(state) : ''}
        </section>
      </section>
    `)(state, emit)

    function renderHeader (state) {
      const id = parseInt(state.params.uid, 10)
      const image = state.artist.data.avatar || {}
      const cover = image.cover
      const profileHeaderImage = state.cache(ProfileHeaderImage, `profile-header-image-${id}`)
      const profileHeader = state.cache(ProfileHeader, `profile-header-${id}`).render({
        data: state.artist.data
      })
      return html`
        <section id="artist-header" class="w-100">
          ${cover ? profileHeaderImage.render({ cover }) : ''}
          ${profileHeader}
        </section>
      `
    }

    function renderTracks (state) {
      const id = parseInt(state.params.uid, 10)
      const playlist = state.cache(Playlist, `playlist-artist-${id}`).render({
        type: 'tracks',
        playlist: state.artist.tracks || []
      })
      return html`
        <section id="artist-playlist" class="flex-auto">
          <h2 class="lh-title">Tracks</h2>
          ${playlist}
        </section>
      `
    }

    function renderTopTracks (state) {
      const id = parseInt(state.params.uid, 10)
      const playlist = state.cache(Playlist, `playlist-artist-top-${id}`).render({
        type: 'tracks',
        playlist: state.artist.topTracks || []
      })
      return html`
        <section id="artist-playlist" class="flex-auto">
          <h2 class="lh-title">Top tracks</h2>
          ${playlist}
        </section>
      `
    }

    function renderLatestRelease (state) {
      const { items = [] } = state.artist.latestRelease
      const id = parseInt(state.params.uid, 10)
      const albums = state.cache(Albums, 'artist-albums-latest-' + id).render({
        items,
        pagination: false
      })
      return html`
        <section id="artist-albums" class="flex-auto">
          <h2 class="lh-title">Latest release</h2>
          ${albums}
        </section>
      `
    }

    function renderAlbums (state) {
      const { items = [], numberOfPages = 1 } = state.artist.albums
      const id = parseInt(state.params.uid, 10)
      const albums = state.cache(Albums, 'artist-albums-' + id).render({
        items,
        numberOfPages: numberOfPages,
        pagination: numberOfPages > 1
      })
      return html`
        <section id="artist-albums" class="flex-auto">
          <h2 class="lh-title">Albums</h2>
          ${albums}
        </section>
      `
    }

    function renderBio (state) {
      const { description: body } = state.artist.data

      return html`
        <section id="bio" class="flex-auto mh3">
          <h4 class="f4">Bio</h4>
          <div class="flex flex-column flex-row-ns">
            <article class="w-100 mw6">
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
      const id = parseInt(state.params.uid, 10)
      const items = []
      const label = state.artist.data.label || {}
      items.push(label)

      return html`
        <section id="members" class="flex-auto mh3">
          <h4 class="f4">Members of</h4>
          <ul class="labels list ma0 pa0 cf">
            ${state.cache(Labels, `labels-${id}`, state, emit).render({ items, pagination: false })}
          </ul>
        </section>
      `
    }
  }
}

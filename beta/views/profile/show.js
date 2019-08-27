const ProfileHeaderImage = require('../../components/profile-header-image')
const ProfileHeader = require('../../components/profile-header')
const button = require('@resonate/button')
const html = require('choo/html')

module.exports = Profile

function Profile () {
  return (state, emit) => {
    const id = state.user.uid

    const image = state.user.avatar || {}
    const profileHeaderImage = state.cache(ProfileHeaderImage, `profile-header-image-${id}`).render({
      cover: image.cover
    })
    const profileHeader = state.cache(ProfileHeader, `profile-header-${id}`).render({
      data: state.user
    })

    const enableNotificationButton = button({
      disabled: state.notification.permission,
      onClick: (e) => emit('notification:request'),
      text: state.notification.permission ? 'Enabled' : 'Enable',
      size: 'none'
    })

    const clearStorageButton = button({
      onClick: (e) => emit('storage:clear'),
      text: 'Clear',
      size: 'none'
    })

    const cookiesOptions = button({
      onClick: (e) => emit('cookies:openDialog'),
      text: 'Update',
      size: 'none'
    })

    return html`
      <section id="profile" class="flex flex-auto flex-column pb6">
        <div class="sticky bg-gray black pa3 z-5 ${!state.resolved ? 'o-0 visibility-hidden dn' : ''}" style="top:var(--height-3)">
          ${id ? html`<p>You can <a href="https://resonate.is/profile/${id}/?profiletab=main&um_action=edit" target="_blank" rel="noopener">edit your profile</a> on resonate.is.</p>` : html`<p>You are not logged in.</p>`}
        </div>
        <section id="profile-header" class="w-100">
          ${profileHeaderImage}
          ${profileHeader}
        </section>
        <section id="settings" class="mh3">
          <fieldset class="pa0 ma0 bn">
            <legend class="f3 lh-title ma0">Notifications</legend>
            <div class="mt2 mb4">
              <label for="notify" class="f5 lh-copy db mb2 required">${!state.notification.permission ? 'Native notifications are disabled' : 'Native notifications are enabled. To change this configuration, update your site settings for beta.resonate.is'}</label>
              ${enableNotificationButton}
            </div>
          </fieldset>

          <fieldset class="pa0 ma0 bn">
            <legend class="f3 lh-title ma0">Storage</legend>

            <div class="mt2 mb4">
              <label for="cache" class="f5 lh-copy db mb2 required">Clear all cached content</label>
              ${clearStorageButton}
            </div>
          </fieldset>

          <fieldset class="pa0 ma0 bn">
            <legend class="f3 lh-title ma0">Cookie consent</legend>

            <div class="mt2 mb4">
              <label for="cache" class="f5 lh-copy db mb2 required">${state.cookieConsentStatus === 'allow' ? 'Cookies are allowed' : 'Cookies are disabled'}</label>
              ${cookiesOptions}
            </div>
          </fieldset>
        </section>
      </section>
      `
  }
}

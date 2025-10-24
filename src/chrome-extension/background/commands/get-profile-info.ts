export async function getProfileInfo(): Promise<{ profileName: string }> {
  try {
    const extensionInfo = await chrome.management.getSelf();

    const profileName = extensionInfo.installType === 'development' ? 'Developer Profile' : 'Chrome User';

    let detectedProfileName = profileName;

    if (chrome.identity?.getProfileUserInfo) {
      try {
        const userInfo = await chrome.identity.getProfileUserInfo();
        if (userInfo?.email) {
          detectedProfileName = userInfo.email;
        }
      } catch {}
    }

    return {
      profileName: detectedProfileName
    };
  } catch (error) {
    console.error('[Background] Error getting profile info:', error);
    return {
      profileName: 'Chrome User'
    };
  }
}

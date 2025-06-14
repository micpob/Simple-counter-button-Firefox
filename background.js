chrome.runtime.onStartup.addListener( () => {
  chrome.action.setBadgeBackgroundColor({ color: '#0062ff' });
  chrome.storage.local.get('total', (counter) => {
    if (counter.total) {
      chrome.action.setBadgeText({'text': counter.total.toString()})
    } else {
      chrome.action.setBadgeText({'text': '0'})
    }
  })
})

chrome.action.onClicked.addListener( () => {
  const newTimestamp = Date.now()

  chrome.storage.local.get(['total', 'step', 'limit', 'notification', 'sound', 'volume', 'chronology'], (counter) => {
    const step = counter.step
    let newTotal = counter.total + step
    if (!Number.isInteger(newTotal)) {
      const digitsBeforePoint = Math.ceil(Math.log10(Math.floor(Math.abs(newTotal))+1))
      const toPrecisionIndex = digitsBeforePoint + 1
      const preciseTotal = newTotal.toPrecision(toPrecisionIndex)
      newTotal = Math.trunc(preciseTotal * 10) / 10
    }

    if (counter.notification) {
      const limit = counter.limit
      sendNotification(step, newTotal, limit)
    }  

    //SOUND
    if (counter.sound) {
      const clickSound = new Audio(chrome.runtime.getURL('Res/Sounds/click_128.mp3'))
      clickSound.volume = counter.volume
      clickSound.play()
    }
    /* if (counter.sound) {
      const source = chrome.runtime.getURL('Res/Sounds/click_128.mp3')
      const volume = counter.volume
      playSound(source, volume)
    } */

    const chronology = counter.chronology.length < 1000 ? counter.chronology : counter.chronology.slice(-199)
    chronology.push(newTimestamp)

    chrome.storage.local.set({'total': newTotal, 'timestamp': newTimestamp, 'chronology': chronology}, () => {
      chrome.action.setBadgeText({'text': newTotal.toString()})
    })
  })
})

chrome.runtime.onInstalled.addListener((details) => {
  /* const currentVersion = chrome.runtime.getManifest().version
  const previousVersion = details.previousVersion */
  const reason = details.reason

  switch (reason) {
     case 'install':
      chrome.storage.local.set({
        "limit": 0,
        "notification": false,
        "step": 1,
        "total": 0,
        "sound": false,
        "volume": 0.5,
        "timestamp": "",
        "showTimestamp": true,
        "chronology": [],
        "chronologyOrder": "oldest"
      }, () => {
        chrome.action.setBadgeBackgroundColor({ color: '#0062ff' });
        setUpContextMenus()
      })
        break;
     case 'update':
      chrome.storage.local.get(['total', 'step', 'limit', 'notification', 'sound', 'volume', 'timestamp', 'showTimestamp', 'chronology', 'chronologyOrder'], (counter) => {
        let notification = counter.notification ? counter.notification : false
        let total = counter.total ? counter.total : 0
        let step = counter.step ? counter.step : 1
        let limit = counter.limit ? counter.limit : 0
        let sound = counter.sound ? counter.sound : false
        let volume = counter.volume ? counter.volume : 0.5
        let timestamp = counter.timestamp ? counter.timestamp : ''
        let showTimestamp = typeof counter.showTimestamp == 'boolean' ? counter.showTimestamp : true
        let chronology = counter.chronology ? counter.chronology : []
        let chronologyOrder = counter.chronologyOrder ? counter.chronologyOrder : 'oldest'
        chrome.storage.local.set({
          "limit": limit,
          "step": step,
          "total": total,
          "notification": notification,
          "sound": sound,
          "volume": volume,
          "timestamp": timestamp,
          "showTimestamp": showTimestamp,
          "chronology": chronology,
          "chronologyOrder": chronologyOrder
        }, () => {
          chrome.action.setBadgeText({'text': total.toString()})
          chrome.action.setBadgeBackgroundColor({ color: '#0062ff' });
          chrome.contextMenus.removeAll(() => {
            setUpContextMenus()
          })
        })
      })
        break;
     case 'chrome_update':
        break;
     case 'shared_module_update':
        break;
     default:
        break;
  }
})

/* async function playSound(source, volume) {
  await createOffscreen();
  await chrome.runtime.sendMessage({ play: { source, volume } });
} */

// Create offscreen document if one doesn't already exist
/* async function createOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'testing'
  });
}
 */




const setUpContextMenus = () => {
  chrome.contextMenus.removeAll(() => {
    chrome.storage.local.get(['step', 'timestamp', 'showTimestamp', 'sound'], (counter) => {
      //revert click context menu item
      const step = -counter.step
      const sign = step >= 0 ? '+' : '' 
      const contextMenuUndoLastClickItem = {
        "id": "simpleCounterButtonUndoLastClickContextMenu",
        "title": `${sign}${step}`,
        "contexts": ["action"]
      }
      chrome.contextMenus.create(contextMenuUndoLastClickItem, () => chrome.runtime.lastError)

      //reset counter context menu item
      const contextMenuCounterResetItem = {
        "id": "simpleCounterButtonResetCounterContextMenu",
        "title": chrome.i18n.getMessage("context_menu_reset_counter"),
        "contexts": ["action"]
      }
      chrome.contextMenus.create(contextMenuCounterResetItem, () => chrome.runtime.lastError)
      
      //last click timestamp context menu item
      if (counter.showTimestamp) {
        const contextMenuLastClickTimestamp = {
          "id": "simpleCounterButtonLastClickTimestampContextMenu",
          "title": `${chrome.i18n.getMessage("context_menu_last_click_timestamp")} ${Number.isInteger(counter.timestamp) ? new Date(counter.timestamp).toLocaleString() : counter.timestamp}`,
          "contexts": ["action"]
        }
        chrome.contextMenus.create(contextMenuLastClickTimestamp, () => chrome.runtime.lastError)
      }

      //set keyboard shortcut
      /* const contextMenuSetkeyboardShortcut = {
        "id": "simpleCounterButtonSetkeyboardShortcutContextMenu",
        "title": chrome.i18n.getMessage("context_menu_set_keyboard_shortcut"),
        "contexts": ["action"]
      }
      chrome.contextMenus.create(contextMenuSetkeyboardShortcut, () => chrome.runtime.lastError) */
      
      //toggle sound on/off
      const contextMenuToggleSoundShortcut = {
        "id": "simpleCounterButtonToggleSoundShortcutContextMenu",
        "title": `${counter.sound ? chrome.i18n.getMessage("context_menu_toggle_sound_off_shortcut") : chrome.i18n.getMessage("context_menu_toggle_sound_on_shortcut") }`,
        "contexts": ["action"]
      }
      chrome.contextMenus.create(contextMenuToggleSoundShortcut, () => chrome.runtime.lastError)     
     
      //Link to other extensions
      /* const contextMenuMyOtherExtensions = {
        "id": "myOtherExtensions",
        "title": chrome.i18n.getMessage("context_menu_my_other_extensions"),
        "contexts": ["action"]
      }
      chrome.contextMenus.create(contextMenuMyOtherExtensions, () => chrome.runtime.lastError) */

    })
  })
}

/* async function playSound(source, volume) {
  await createOffscreen();
  await chrome.runtime.sendMessage({ play: { source, volume } });
} */

chrome.contextMenus.onClicked.addListener((clickData) => {
  if (clickData.menuItemId == 'simpleCounterButtonResetCounterContextMenu') {
    chrome.storage.local.set({'total': 0}, () => {
      chrome.action.setBadgeText({'text': '0'})
      chrome.permissions.contains({permissions: ['notifications']}, (result) => {
        if (result) {
          chrome.notifications.getAll((items) => {
            if (items) {
              for (let key in items) {
                chrome.notifications.clear(key)
              }
            }
          })
        }
      })
    })
  }

  if (clickData.menuItemId == 'simpleCounterButtonUndoLastClickContextMenu') {
    const newTimestamp = Date.now()
    chrome.storage.local.get(['total', 'step', 'limit', 'notification', 'sound', 'volume', 'chronology'], (counter) => {
      const step = counter.step
      let newTotal = counter.total - step

      if (!Number.isInteger(newTotal)) {
        const digitsBeforePoint = Math.ceil(Math.log10(Math.floor(Math.abs(newTotal))+1))
        const toPrecisionIndex = digitsBeforePoint + 1
        const preciseTotal = newTotal.toPrecision(toPrecisionIndex)
        newTotal = Math.trunc(preciseTotal * 10) / 10
      }

      /* if (counter.limit && counter.notification) {
        sendNotification(step, newTotal, counter.limit)
      } */

      //SOUND
      if (counter.sound) {
        const clickSound = new Audio(chrome.runtime.getURL('Res/Sounds/click_128.mp3'))
        clickSound.volume = counter.volume
        clickSound.play()
      }
      /* if (counter.sound) {
        const source = chrome.runtime.getURL('Res/Sounds/click_128.mp3')
        const volume = counter.volume
        playSound(source, volume)
      } */
  
      const chronology = counter.chronology.length < 1000 ? counter.chronology : counter.chronology.slice(-199)
      chronology.push(newTimestamp)
  
      chrome.storage.local.set({'total': newTotal, 'timestamp': newTimestamp, 'chronology': chronology}, () => {
        chrome.action.setBadgeText({'text': newTotal.toString()})
      })

    })
  }

  if (clickData.menuItemId == 'simpleCounterButtonLastClickTimestampContextMenu') {
    chrome.tabs.create({ url: chrome.runtime.getURL('Chronology/chronology.html') })
  }

  /* if (clickData.menuItemId == 'simpleCounterButtonSetkeyboardShortcutContextMenu') {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
  } */

  if (clickData.menuItemId == 'simpleCounterButtonToggleSoundShortcutContextMenu') {
    chrome.storage.local.get(['sound'], (counter) => {
      if (counter.sound) {
        chrome.storage.local.set({'sound': false}) 
      } else {
        chrome.storage.local.set({'sound': true}) 
      }
    })
  }

  /* if (clickData.menuItemId == 'myOtherExtensions') {
    chrome.tabs.create({ url: 'https://chromewebstore.google.com/search/micpob' })
  } */

})

chrome.storage.onChanged.addListener((changes) => {
  for(key in changes) {
    if (key === 'step') {
      const newStep = -changes.step.newValue
      const sign = newStep >= 0 ? '+' : '' 
      chrome.contextMenus.update('simpleCounterButtonUndoLastClickContextMenu', {title: `${sign}${newStep}`}, () => chrome.runtime.lastError);
    }

    if (key === 'timestamp') {
      let newTimestamp = changes.timestamp.newValue
      newTimestamp = new Date(newTimestamp).toLocaleString()
      chrome.storage.local.get('showTimestamp', (counter) => {
        if (counter.showTimestamp) {
          chrome.contextMenus.update('simpleCounterButtonLastClickTimestampContextMenu', {title: `${chrome.i18n.getMessage("context_menu_last_click_timestamp")} ${newTimestamp}`}, () => chrome.runtime.lastError);
        }
      })
    }

    if (key === 'showTimestamp') {
      setUpContextMenus()    
    }

    if (key === 'sound') {
      const newSoundValue = changes.sound.newValue
const sendNotification = async (step, total, limit) => {
  if (step > 0 && total >= limit || step < 0 && total <= limit) {
    browser.notifications.getAll((items) => {
      if (items && Object.keys(items).length > 0) {
        //console.log('notification already opened:', items)
      } else {
        const options = {
          type: 'basic',
          iconUrl: 'Res/Icons/icon48.png',
          title: browser.i18n.getMessage('notification_title'),
          message: browser.i18n.getMessage('notification_message') + limit,
          /* requireInteraction: true, */
          priority: 2
        }
        browser.notifications.create('LimitReachedNotification', options, () => {
          browser.notifications.onClicked.addListener(clearAllNotifications)
          browser.notifications.onClosed.addListener(clearAllNotifications)
        })
  }
})
  }
}

const clearAllNotifications = () => {
  browser.notifications.getAll((items) => {
    if (items) {
      for (let key in items) {
        browser.notifications.clear(key)
      }
    }
  })
}

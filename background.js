browser.runtime.onStartup.addListener( () => {
  browser.action.setBadgeBackgroundColor({ color: '#0062ff' });
  browser.storage.local.get('total', (counter) => {
    if (counter.total) {
      browser.action.setBadgeText({'text': counter.total.toString()})
    } else {
      browser.action.setBadgeText({'text': '0'})
    }
  })
})

browser.action.onClicked.addListener( () => {
  const newTimestamp = Date.now()

  browser.storage.local.get(['total', 'step', 'limit', 'notification', 'sound', 'volume', 'chronology'], (counter) => {
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
      const clickSound = new Audio(browser.runtime.getURL('Res/Sounds/click_128.mp3'))
      clickSound.volume = counter.volume
      clickSound.play()
    }
    /* if (counter.sound) {
      const source = browser.runtime.getURL('Res/Sounds/click_128.mp3')
      const volume = counter.volume
      playSound(source, volume)
    } */

    const chronology = counter.chronology.length < 1000 ? counter.chronology : counter.chronology.slice(-199)
    chronology.push(newTimestamp)

    browser.storage.local.set({'total': newTotal, 'timestamp': newTimestamp, 'chronology': chronology}, () => {
      browser.action.setBadgeText({'text': newTotal.toString()})
    })
  })
})

browser.runtime.onInstalled.addListener((details) => {
  /* const currentVersion = browser.runtime.getManifest().version
  const previousVersion = details.previousVersion */
  const reason = details.reason

  switch (reason) {
     case 'install':
      browser.storage.local.set({
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
        browser.action.setBadgeBackgroundColor({ color: '#0062ff' });
        setUpContextMenus()
      })
        break;
     case 'update':
      browser.storage.local.get(['total', 'step', 'limit', 'notification', 'sound', 'volume', 'timestamp', 'showTimestamp', 'chronology', 'chronologyOrder'], (counter) => {
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
        browser.storage.local.set({
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
          browser.action.setBadgeText({'text': total.toString()})
          browser.action.setBadgeBackgroundColor({ color: '#0062ff' });
          browser.contextMenus.removeAll(() => {
            setUpContextMenus()
          })
        })
      })
        break;
     case 'browser_update':
        break;
     case 'shared_module_update':
        break;
     default:
        break;
  }
})

const setUpContextMenus = () => {
  browser.contextMenus.removeAll(() => {
    browser.storage.local.get(['step', 'timestamp', 'showTimestamp', 'sound'], (counter) => {
      //revert click context menu item
      const step = -counter.step
      const sign = step >= 0 ? '+' : '' 
      const contextMenuUndoLastClickItem = {
        "id": "simpleCounterButtonUndoLastClickContextMenu",
        "title": `${sign}${step}`,
        "contexts": ["action"]
      }
      browser.contextMenus.create(contextMenuUndoLastClickItem, () => browser.runtime.lastError)

      //reset counter context menu item
      const contextMenuCounterResetItem = {
        "id": "simpleCounterButtonResetCounterContextMenu",
        "title": browser.i18n.getMessage("context_menu_reset_counter"),
        "contexts": ["action"]
      }
      browser.contextMenus.create(contextMenuCounterResetItem, () => browser.runtime.lastError)
      
      //last click timestamp context menu item
      if (counter.showTimestamp) {
        const contextMenuLastClickTimestamp = {
          "id": "simpleCounterButtonLastClickTimestampContextMenu",
          "title": `${browser.i18n.getMessage("context_menu_last_click_timestamp")} ${Number.isInteger(counter.timestamp) ? new Date(counter.timestamp).toLocaleString() : counter.timestamp}`,
          "contexts": ["action"]
        }
        browser.contextMenus.create(contextMenuLastClickTimestamp, () => browser.runtime.lastError)
      }

      //set keyboard shortcut
      /* const contextMenuSetkeyboardShortcut = {
        "id": "simpleCounterButtonSetkeyboardShortcutContextMenu",
        "title": browser.i18n.getMessage("context_menu_set_keyboard_shortcut"),
        "contexts": ["action"]
      }
      browser.contextMenus.create(contextMenuSetkeyboardShortcut, () => browser.runtime.lastError) */
      
      //toggle sound on/off
      const contextMenuToggleSoundShortcut = {
        "id": "simpleCounterButtonToggleSoundShortcutContextMenu",
        "title": `${counter.sound ? browser.i18n.getMessage("context_menu_toggle_sound_off_shortcut") : browser.i18n.getMessage("context_menu_toggle_sound_on_shortcut") }`,
        "contexts": ["action"]
      }
      browser.contextMenus.create(contextMenuToggleSoundShortcut, () => browser.runtime.lastError)

      const contextMenuOpenOptionsPage = {
        "id": "simpleCounterButtonOpenOptionsPageContextMenu",
        "title": browser.i18n.getMessage("context_menu_open_options_page"),
        "contexts": ["action"]
      }
      browser.contextMenus.create(contextMenuOpenOptionsPage, () => browser.runtime.lastError)     
     
      //Link to other extensions
      /* const contextMenuMyOtherExtensions = {
        "id": "myOtherExtensions",
        "title": browser.i18n.getMessage("context_menu_my_other_extensions"),
        "contexts": ["action"]
      }
      browser.contextMenus.create(contextMenuMyOtherExtensions, () => browser.runtime.lastError) */

    })
  })
}

browser.contextMenus.onClicked.addListener((clickData) => {
  if (clickData.menuItemId == 'simpleCounterButtonResetCounterContextMenu') {
    browser.storage.local.set({'total': 0}, () => {
      browser.action.setBadgeText({'text': '0'})
      browser.permissions.contains({permissions: ['notifications']}, (result) => {
        if (result) {
          browser.notifications.getAll((items) => {
            if (items) {
              for (let key in items) {
                browser.notifications.clear(key)
              }
            }
          })
        }
      })
    })
  }

  if (clickData.menuItemId == 'simpleCounterButtonUndoLastClickContextMenu') {
    const newTimestamp = Date.now()
    browser.storage.local.get(['total', 'step', 'limit', 'notification', 'sound', 'volume', 'chronology'], (counter) => {
      const step = counter.step
      let newTotal = counter.total - step

      if (!Number.isInteger(newTotal)) {
        const digitsBeforePoint = Math.ceil(Math.log10(Math.floor(Math.abs(newTotal))+1))
        const toPrecisionIndex = digitsBeforePoint + 1
        const preciseTotal = newTotal.toPrecision(toPrecisionIndex)
        newTotal = Math.trunc(preciseTotal * 10) / 10
      }

      if (counter.limit && counter.notification) {
        sendNotification(step, newTotal, counter.limit)
      }

      //SOUND
      if (counter.sound) {
        const clickSound = new Audio(browser.runtime.getURL('Res/Sounds/click_128.mp3'))
        clickSound.volume = counter.volume
        clickSound.play()
      }
      /* if (counter.sound) {
        const source = browser.runtime.getURL('Res/Sounds/click_128.mp3')
        const volume = counter.volume
        playSound(source, volume)
      } */
  
      const chronology = counter.chronology.length < 1000 ? counter.chronology : counter.chronology.slice(-199)
      chronology.push(newTimestamp)
  
      browser.storage.local.set({'total': newTotal, 'timestamp': newTimestamp, 'chronology': chronology}, () => {
        browser.action.setBadgeText({'text': newTotal.toString()})
      })

    })
  }

  if (clickData.menuItemId == 'simpleCounterButtonLastClickTimestampContextMenu') {
    browser.tabs.create({ url: browser.runtime.getURL('Chronology/chronology.html') })
  }

  /* if (clickData.menuItemId == 'simpleCounterButtonSetkeyboardShortcutContextMenu') {
    browser.tabs.create({ url: 'browser://extensions/shortcuts' })
  } */

  if (clickData.menuItemId == 'simpleCounterButtonToggleSoundShortcutContextMenu') {
    browser.storage.local.get(['sound'], (counter) => {
      if (counter.sound) {
        browser.storage.local.set({'sound': false}) 
      } else {
        browser.storage.local.set({'sound': true}) 
      }
    })
  }

  if (clickData.menuItemId == 'simpleCounterButtonOpenOptionsPageContextMenu') {
    browser.runtime.openOptionsPage()
  }

  /* if (clickData.menuItemId == 'myOtherExtensions') {
    browser.tabs.create({ url: 'https://browserwebstore.google.com/search/micpob' })
  } */

})

browser.storage.onChanged.addListener((changes) => {
  for(key in changes) {
    if (key === 'step') {
      const newStep = -changes.step.newValue
      const sign = newStep >= 0 ? '+' : '' 
      browser.contextMenus.update('simpleCounterButtonUndoLastClickContextMenu', {title: `${sign}${newStep}`}, () => browser.runtime.lastError);
    }

    if (key === 'timestamp') {
      let newTimestamp = changes.timestamp.newValue
      newTimestamp = new Date(newTimestamp).toLocaleString()
      browser.storage.local.get('showTimestamp', (counter) => {
        if (counter.showTimestamp) {
          browser.contextMenus.update('simpleCounterButtonLastClickTimestampContextMenu', {title: `${browser.i18n.getMessage("context_menu_last_click_timestamp")} ${newTimestamp}`}, () => browser.runtime.lastError);
        }
      })
    }

    if (key === 'showTimestamp') {
      setUpContextMenus()    
    }

    if (key === 'sound') {
      const newSoundValue = changes.sound.newValue
      browser.contextMenus.update('simpleCounterButtonToggleSoundShortcutContextMenu', {title: `${newSoundValue ? browser.i18n.getMessage("context_menu_toggle_sound_off_shortcut") : browser.i18n.getMessage("context_menu_toggle_sound_on_shortcut") }`}, () => browser.runtime.lastError);
    }
  }
})

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

// ==UserScript==
// @name         D.GG Extra Features
// @namespace    http://tampermonkey.net/
// @version      2.1.3
// @update       https://raw.githubusercontent.com/Voiture-0/DggExtraFeatures/master/Dgg-Extra-Features.js
// @updateURL    https://raw.githubusercontent.com/Voiture-0/DggExtraFeatures/master/Dgg-Extra-Features.js
// @downloadURL  https://raw.githubusercontent.com/Voiture-0/DggExtraFeatures/master/Dgg-Extra-Features.js
// @description  Adds features to the destiny.gg chat
// @author       Voiture
// @include      /https:\/\/www\.destiny\.gg\/embed\/chat.*/
// @include      /https:\/\/www\.destiny\.gg\/bigscreen.*/
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    /******************************************/
    /* Constants & Global Variables ***********/
    /******************************************/

    // Load Config Settings
    const config = {
        username: null,
        messageStartingLeft: 79.09375,//83.72917175292969,
        messageStartingLeftNewLine: 19,
        autoSendMessages: false,
        clickableEmotes: true,
        convertEmbedLinks: true,
        showVerticalComboButtons: false,
        theme: null,
    };

    const WIDTHS = {
        _: 5.87,// ranges from 5.865 to 5.880
        '.': 3.42,
        nathanTiny2_OG: 28,
        space: 3.22,
        '👞👞':  35.7,
    };

    const emoteCenterOffsets = {
        gachiGASM: 5,
        Wowee: 3,
        BASEDWATM8: 10,
        SLEEPSTINY: -16,
        LeRuse: -1,
        UWOTM8: -8,
        SoDoge: -14,
        OhKrappa: 3,
        AngelThump: 2,
        BibleThump: 2,
        Klappa: -7,
        Kappa: 1,
        DuckerZ: 10,
        OverRustle: 4,
        SURPRISE: -3,
        LUL: -3,
        SOY: -8,
        CUX: -1,
        ResidentSleeper: 7,
		OMEGALUL: 4,
		MALARKEY: -8,
    };

    const weebEmotes = [ 'AYAYA', 'ComfyAYA', 'miyanobird', 'MiyanoHype', 'nathanAYAYA', 'nathanWeeb', 'NOBULLY' ];
    const WEEB_EMOTE_REPLY = 'tonyW';

    const embedLinks = {
        '#twitch': {
            convertedLink: 'https://www.twitch.tv/'
        },
        '#youtube': {
            convertedLink: 'https://www.youtube.com/watch?v='
        },
        '#twitch-vod': {
            convertedLink: 'https://www.twitch.tv/videos/'
        },
        '#twitch-clip': {
            convertedLink: 'https://clips.twitch.tv/'
        }
    };

    const emoteBackLog = {
        history: [],
        current: 0,
    };

    const LEFT_CLICK = 0;
    const MIDDLE_CLICK = 1;

    let mentionsWindow = null;
    let chatHidden = false;
    const TURKEY_EMOTE = 'PepoTurkey';
    const goblIcon = (testIfEmoteExists(TURKEY_EMOTE) ? TURKEY_EMOTE : '🦃');

    /******************************************/
    /* Utility Functions **********************/
    /******************************************/

    // Send chat message
    function sendChatMessage(message, forceSend = false) {
        const chatBox = document.getElementById('chat-input-control');
        chatBox.value = message;
        if (config.autoSendMessages || forceSend) {
            simulateEnterKeyPress(chatBox);
        }
    }

    // Append chat message
    function setChatMessage(message, forceSend = false) {
        const chatBox = document.getElementById('chat-input-control');
        chatBox.value = message;
        if (forceSend) {
            simulateEnterKeyPress(chatBox);
        }
    }

    // Triggers an enter key press on an element
    function simulateEnterKeyPress(elem) {
        elem.dispatchEvent(
            new KeyboardEvent('keypress', { key: 'Enter', keyCode: 13 }),
        );
    }

    // Checks if a user is mentioned in a message
    function messageMentionsUsername(message, username) {
        const mentions = message.dataset.mentioned;
        return (
            mentions !== undefined &&
            mentions.split(' ').includes(username.toLowerCase())
        );
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // shuffles the characters in a string
    function shuffleString(str) {
        if (!str) return str;
        // Fisher Yates shuffle algorithm
        var a = str.split(''),
            n = a.length;

        for(var i = n - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }
        return a.join('');

    }

    // paste a string at the cursor's position in the chat box
    function addToChatBox(str, autoSendMessage) {
        const selectionStart = document.getElementById('chat-input-control').selectionStart;
        const selectionEnd = document.getElementById('chat-input-control').selectionEnd;
        const messageStart = document.getElementById('chat-input-control')
            .value
            .substr(0, selectionStart);
        const messageEnd = document.getElementById('chat-input-control').value.substr(selectionEnd);
        const message = `${messageStart.trimEnd()} ${str.trim()} ${messageEnd.trimStart()}`;
        setChatMessage(message, autoSendMessage);
        if (!autoSendMessage) {
            // Reset cursor position
            document.getElementById('chat-input-control').focus();
            const cursorPosition = `${messageStart} ${str} `.length;
            document.getElementById('chat-input-control').selectionStart = cursorPosition;
            document.getElementById('chat-input-control').selectionEnd = cursorPosition;
        }
    }

    function testIfEmoteExists(emote) {
        // if(emote === undefined || emote === null || typeof emote !== 'string') return false;
        // const emoteElement = document.createElement('div');
        // emoteElement.className = 'hidden emote ' + emote;
        // document.getElementById('chat-emote-list').append(emoteElement);
        // await sleep(200);
        // const emoteExists = (getComputedStyle(emoteElement).backgroundImage !== 'none');
        // emoteElement.remove();
        // return emoteExists;
        return true;
    }

    /******************************************/
    /* Utility Functions **********************/
    /******************************************/

    function addLightThemeStyle() {
        const css = `
        #chat.voiture-light-theme {
            background: #f7f7f7;
            color: #666;
        }

        #chat.voiture-light-theme .msg-chat {
            color: #464646;
        }

        #chat.voiture-light-theme .msg-chat .user {
            color: #232323;
        }

        #chat.voiture-light-theme .msg-chat .green-text {
            color: #588c1a;
        }

        #chat.voiture-light-theme hr {
            border-top: 1px solid #ddd;
            border-bottom: 1px solid #fff;
        }

        #chat.voiture-light-theme.pref-taggedvisibility div.msg-tagged {
            background-color: #dcdcdc;
        }

        #chat.voiture-light-theme #chat-input-control {
            background: #eee;
            border: 1px solid #ddd;
            color: #464646;
        }
        #chat.voiture-light-theme #chat-input-control::placeholder {
            color: #ddd;
        }

        #chat.voiture-light-theme #chat-tools-wrap .btn-icon {
            filter: brightness(.01);
        }

        #chat.voiture-light-theme .msg-chat .externallink {
            color: #2e75d0;
        }

        #chat.voiture-light-theme .user.flair8 {
            color: #c825be;
        }

        #chat.voiture-light-theme .user.flair13,
        #chat.voiture-light-theme .user.flair9 {
            color: #5477ca;
        }

        #chat.voiture-light-theme .user.flair11 {
            color: #6d6d6d;
        }

        #chat.voiture-light-theme .msg-own {
            background-color: #eaeaea;
        }

        #chat.voiture-light-theme .msg-highlight {
            background-color: #cfe9ff!important;
        }

        #chat.voiture-light-theme .user.flair3 {
            color: #57aa36;
        }

        #chat.voiture-light-theme #chat-auto-complete li {
            color: #717171;
            background: rgba(238, 238, 238, .85);
        }

        #chat.voiture-light-theme .user.admin {
            color: #bf4f4f;
        }

        #chat.voiture-light-theme .chat-scroll-notify {
            color: #7c7c7c;
            background: #eee;
        }

        #chat.voiture-light-theme .chat-combo .combo,
        #chat.voiture-light-theme .chat-combo .count,
        #chat.voiture-light-theme .chat-combo .hit,
        #chat.voiture-light-theme .chat-combo .x {
            text-shadow: -1px -1px 0 #444, 1px -1px 0 #444, -1px 1px 0 #444, 1px 1px 0 #444;
        }

        #chat.voiture-light-theme .chat-combe .hit,
        #chat.voiture-light-theme .chat-combo .combo {
            color: #eee;
        }

        #chat.voiture-light-theme .chat-combo .count,
        #chat.voiture-light-theme .chat-combo .x {
            color: #ddd;
        }

        #chat.voiture-light-theme .msg-whisper {
            background-color: #eaeaea;
        }

        #chat.voiture-light-theme #chat-whisper-unread-indicator {
            color: #423f40;
        }

        #chat.voiture-light-theme .chat-menu .chat-menu-inner {
            background-color: #ddd;
        }

        #chat.voiture-light-theme #chat-whisper-users .unread-0 .user,
        #chat.voiture-light-theme #chat-whisper-users .unread-0 .user:hover {
            color: #666;
        }

        #chat.voiture-light-theme .chat-menu .toolbar h5 {
            color: #666;
        }

        #chat.voiture-light-theme #chat-whisper-users .conversation .remove {
            filter: invert(1);
        }

        #chat.voiture-light-theme .chat-menu .toolbar {
            border-bottom: 1px solid #ccc;
        }

        #chat.voiture-light-theme .chat-menu .toolbar .chat-menu-close {
            filter: invert(1);
        }

        #chat.voiture-light-theme .chat-output:not(.chat-win-main) .msg-historical {
            background-color: #eaeaea;
            color: #212121;
        }

        #chat.voiture-light-theme #chat-windows-select {
            background: #ccc;
        }

        #chat.voiture-light-theme #chat-windows-select .tab.active {
            color: #212121;
            background: #9d9d9d;
        }

        #chat.voiture-light-theme #chat-windows-select .tab-close {
            filter: invert(1);
        }

        #chat.voiture-light-theme .user.flair17 {
            color: #c4af00;
        }

        #chat.voiture-light-theme #chat-auto-complete li.active {
            color: #000;
        }

        #chat.voiture-light-theme .nano>.nano-pane>.nano-slider {
            background: #717171;
        }

        #chat.voiture-light-theme .form-control {
            color: #464646!important;
            background: #fcfcfc!important;
            border: 1px solid #b5b5b5!important;
        }

        #chat.voiture-light-theme .emote.GameOfThrows {
            filter: drop-shadow(1px 1px 0 #000);
        }

        @keyframes DANKMEMES-anim {
            0%,
            100% {
                -webkit-filter: hue-rotate(0);
                filter: hue-rotate(0);
            }
            50% {
                -webkit-filter: hue-rotate(360deg);
                filter: hue-rotate(360deg);
            }
        }

        @keyframes DANKMEMES-anim-hover {
            0%,
            100% {
                -webkit-filter: hue-rotate(0);
                filter: hue-rotate(0);
            }
            50% {
                -webkit-filter: hue-rotate(360deg);
                filter: hue-rotate(360deg);
            }
        }

        #chat.voiture-light-theme .msg-broadcast {
            text-shadow: 1px 1px 3px #404040;
            background-color: #d9d9d9;
            color: #fffd79!important;
        }

        #chat.voiture-light-theme .user.flair12 {
            color: #e38602;
        }

        #chat.voiture-light-theme .user.flair1 {
            color: #30bbab;
        }

        #chat.voiture-light-theme .user.flair8 {
            color: #d532cb;
        }
        #chat.voiture-light-theme button.btn-dark {
            color: unset;
            background: #fcfcfc;
        }
        #chat.voiture-light-theme #chat-tools-wrap .voiture-btn-icon {
            color: black;
        }
        #chat.voiture-light-theme .msg-chat .chat-user {
            background: rgba(0,0,0,0.08);
        }
        #chat.voiture-light-theme .msg-chat .chat-user:hover {
            background: rgba(0,0,0,0.14);
        }
        `;
        const style = document.createElement("style");
        style.type = "text/css";
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
        changeTheme();
    }

    function changeTheme(theme) {
        if (theme !== undefined) {
            // Update config
            config.theme = theme;
            saveConfig();
        }

        // Remove all themes
        document.getElementById('chat').classList.remove('voiture-light-theme');

        // Add selected theme class
        switch(config.theme) {
            case 'light':
                document.getElementById('chat').classList.add('voiture-light-theme');
                break;
        }
    }

    /******************************************/
    /* Emote Back *****************************/
    /******************************************/

    function clearEmoteBackButton(resetPointer = true) {
        // Remove click event
        const oldBtn = document.getElementById('chat-emote-back-btn');
        const btn = oldBtn.cloneNode(true); // Easiest way to remove old event listener
        btn.setAttribute('title', '');
        oldBtn.parentNode.replaceChild(btn, oldBtn);

        // Remove classes to hide it
        var emoteBackBtnEmote = btn.querySelector('.emote.voiture-btn-icon');
        emoteBackBtnEmote.className = 'emote voiture-btn-icon';

        addEmoteBackListeners();

        // reset emote back log index
        if (resetPointer) emoteBackLog.current = -1;
    }

    function emoteBack(user, emote) {
        clearEmoteBackButton();

        // send emote back at emoter
        if (emote && user && user !== config.username) {
            let emoteMessage = user + ' ';
            if (emote === TURKEY_EMOTE) {
                emoteMessage += generateGoblMessage();
            } else if (weebEmotes.includes(emote)) {
                emoteMessage += WEEB_EMOTE_REPLY;
            } else {
                emoteMessage += emote;
            }
            sendChatMessage(emoteMessage);
        }
    }

    function setEmoteBackButton(emoteMention) {
        clearEmoteBackButton(false);
        const btn = document.getElementById('chat-emote-back-btn');
        btn.setAttribute('title', `${emoteMention.mentionedBy} ${emoteMention.emoteName}`);
        btn.addEventListener('click', e => emoteBack(emoteMention.mentionedBy, emoteMention.emoteName));
        btn.querySelector('.emote-scaling-wrapper').innerHTML = `<i class="voiture-btn-icon emote ${emoteMention.emoteName}"></i>`;
    }

    function saveEmoteMention(mentionedBy, emoteName) {
        const emoteMention = { mentionedBy, emoteName };
        emoteBackLog.history.unshift(emoteMention);
        if(emoteBackLog.current > 0) {
            emoteBackLog.current++;
        } else {
            setEmoteBackButton(emoteMention);
        }
    }

    function scrollEmoteMentions(direction) {
        if(emoteBackLog.history.length === 0) return;

        var newCurrent = emoteBackLog.current + direction;
        if(newCurrent < 0) newCurrent = 0;
        if(newCurrent > emoteBackLog.history.length - 1) newCurrent = emoteBackLog.history.length - 1;

        // console.debug(emoteBackLog.current + ' --> ' + newCurrent, emoteBackLog.history);

        if(emoteBackLog.current !== newCurrent) {
            emoteBackLog.current = newCurrent;
            setEmoteBackButton(emoteBackLog.history[emoteBackLog.current]);
        }
    }

    /******************************************/
    /* Chat Observer **************************/
    /******************************************/

    // Look for messages where we have been emoted at
    function observeChat() {
        const emotedAtObserveFunction = function (mutations) {
            for (let i = 0; i < mutations.length; i++) {
                for (let j = 0; j < mutations[i].addedNodes.length; j++) {
                    // Get new message
                    const message = mutations[i].addedNodes[j];

                    // Skip own messages
                    if (message.classList.contains('msg-own')) continue;
                    // Skip non-mentions
                    if (!messageMentionsUsername(message, config.username)) continue;

                    const messageText = message.querySelector('.text');
                    if (!messageText.innerText.toLowerCase().includes(config.username.toLowerCase())) continue; // TODO: change to look at .chat-user elements?
                    const usersOrEmotes = messageText.querySelectorAll('.chat-user, .emote');
                    let emoteName = null;
                    let lookingForNextEmote = false;
                    for (const elem of usersOrEmotes) {
                        if (!lookingForNextEmote && elem.innerText.toLowerCase() === config.username.toLowerCase()) {
                            lookingForNextEmote = true;
                        } else if (lookingForNextEmote && elem.classList.contains('emote')) {
                            emoteName = elem.innerText;
                            break;
                        }
                    }
                    // If we were emoted at
                    if (emoteName != null) {
                        // Get emoter
                        const mentionedBy = message.querySelector('a.user').innerText;
                        // save mention
                        saveEmoteMention(mentionedBy, emoteName);
                    }

                }
            }
        };

        // Look at chat for any embed links (ex: #twitch/destiny)
        const convertLinksObserveFunction = function (mutations) {
            if (config.convertEmbedLinks) {
                for (const mutation of mutations) {
                    for (const message of mutation.addedNodes) {
                        const links = message.querySelectorAll('a.externallink.bookmarklink');
                        for (const link of links) {
                            convertEmbedLinkToExternalLink(link);
                        }
                    }
                }
            }
        };

		// Look at chat for any twitter links to fix (remove ?s=21)
        const convertTwitterLinksObserveFunction = function (mutations) {
			const twitterRegex = /((http|https):\/\/)?((www|mobile)\.)?(twitter\.com\/)(.+)(\?s=\d+)?/;
			for (const mutation of mutations) {
				for (const message of mutation.addedNodes) {
					const links = message.querySelectorAll('a.externallink');
					for (const link of links) {
						if (twitterRegex.test(link.href)) fixTwitterLinks(link);
					}
				}
			}
        };

        // Create observers
        const emotedAtObserver = new MutationObserver(emotedAtObserveFunction);
        const linkObserver = new MutationObserver(convertLinksObserveFunction);
        const twitterLinkObserver = new MutationObserver(convertTwitterLinksObserveFunction);

        const chat = document.querySelector('#chat-win-main .chat-lines');

        // Observe chat
        emotedAtObserver.observe(chat, {
            attributes: true,
            childList: true,
            characterData: true,
        });
        linkObserver.observe(chat, {
            attributes: true,
            childList: true,
            characterData: true,
        });
        twitterLinkObserver.observe(chat, {
            attributes: true,
            childList: true,
            characterData: true,
        });
    }

    /******************************************/
    /* nathanTiny2 Align Combo ****************/
    /******************************************/

    function getOwnStartingLeft(username) {
        const exampleMessageSelector = `div.msg-chat.msg-user.msg-own:not(.msg-continue)[data-username='${username.toLowerCase()}'] > span.text`;
        let exampleMessage = exampleMessageSelector;
        if (exampleMessage == null) {
            // If there is no message to measure, send a message to measure
            // Send message
            if (['Voiture', 'AFrenchCar'].includes(config.username)) {
                sendChatMessage('YEE Wowee', true);
            } else {
                sendChatMessage('Voiture you are a really cool chatter btw :)', true); // PepeLaugh
            }

            // Get example message
            exampleMessage = exampleMessageSelector;

            if (exampleMessage == null) {
                const error = 'Unable to measure, please tell Voiture about this';
                alert(error);
                throw error;
            }
        }
        return exampleMessage.getBoundingClientRect().left;
    }

    function measureRecentMessageDiffLeft(emote) {
        // Find own message's starting left position
        const isContinuingMessage = (document.querySelector('#chat-win-main > .chat-lines > :last-child').dataset.username.toLowerCase() === config.username.toLowerCase());
        const ownMessageStartingLeft = isContinuingMessage
            ? config.messageStartingLeftNewLine
            : config.messageStartingLeft;

        // Find most recent message's emote starting left position
        const lastMessageEmote = document.querySelector('#chat-win-main > .chat-lines > :last-child > .text > .emote');
        if (lastMessageEmote == null) return false;   // No emote to align to

        const emoteElem = lastMessageEmote;
        const emoteName = emoteElem.getAttribute('title');
        const recentMessageEmoteLeft = emoteElem.getBoundingClientRect().left   // Get emote left
            + (emoteElem.getBoundingClientRect().width / 2 - WIDTHS[emote] / 2)           // Center emotes
            + (emoteCenterOffsets[emoteName] || 0);                 // Emote specific adjustment

        // Return difference in positions
        return recentMessageEmoteLeft - ownMessageStartingLeft;
    }

    function getNumberOfCharactersToAlign(recentMessageEmoteDiff) {
        const underscore = '_', period = '.';   // Spacer characters
        if (recentMessageEmoteDiff >= 0) {
            if (recentMessageEmoteDiff >= 0.4 * WIDTHS[underscore]) {
                recentMessageEmoteDiff -= WIDTHS.space; // Subtract space between _ and emote
            }
            let numOfChars = recentMessageEmoteDiff / WIDTHS[underscore];
            let adjustment = '';
            if (numOfChars % 1 >= 0.85) {
                adjustment = underscore;
            } else if (numOfChars % 1 >= 0.4) {
                adjustment = period;
            }
            numOfChars = Math.floor(Math.max(0, numOfChars));
            return adjustment + underscore.repeat(Math.floor(numOfChars));
        }
    }

    function getEmoteAlignedMessage(emote) {
        const recentMessageEmoteDiff = measureRecentMessageDiffLeft(emote);
		if (recentMessageEmoteDiff == false || recentMessageEmoteDiff > 300) return '';
        const message = getNumberOfCharactersToAlign(recentMessageEmoteDiff);
        if (message === undefined) return '';
        return message + ' ' + emote;
    }

    function showVerticalComboButtons(value) {
        if(value !== undefined) {
            config.showVerticalComboButtons = value;
            saveConfig();
        }
        if (config.showVerticalComboButtons) {
            document.getElementById('chat-nathanTiny2-btn').classList.remove('hidden');
            document.getElementById('chat-👞👞-btn').classList.remove('hidden');
        } else {
            document.getElementById('chat-nathanTiny2-btn').classList.add('hidden');
            document.getElementById('chat-👞👞-btn').classList.add('hidden');
        }
    }

    /******************************************/
    /* Auto-Message Toggle ********************/
    /******************************************/

    function toggleAutoSendMessages(value) {
        config.autoSendMessages = value;
        saveConfig();
    }

    /******************************************/
    /* Click Emotes ***************************/
    /******************************************/

    function emoteClick(event) {
        const classes = event.target.classList;
        if (config.clickableEmotes && classes.contains('emote')) {
            event.preventDefault();
            const mouseButton = event.button;
            if(mouseButton === LEFT_CLICK || mouseButton === MIDDLE_CLICK) {
                const emote = classes.toString().replace('emote', '').trim();
                const autoSendMessage = mouseButton === MIDDLE_CLICK;
                addToChatBox(emote, autoSendMessage);
            }
        }
    }

    function toggleEmoteClicks(value) {
        config.clickableEmotes = value;
        saveConfig();
    }

    /******************************************/
    /* Convert Embed Links ********************/
    /******************************************/

    function convertEmbedLinkToExternalLink(link) {
        const linkText = link.innerText;
        const linkParts = linkText.split('/');
        const linkKey = linkParts[0].toLowerCase();
        if (embedLinks[linkKey] !== undefined) {
            // Save original href
            if (link.getAttribute('data-voiture-original-href') === null) {
                link.setAttribute('data-voiture-original-href', link.href);
            }
            const newUrl = embedLinks[linkKey].convertedLink;
            link.target = '_blank';
            link.href = newUrl + linkParts[1];
        }
    }

    function unconvertEmbedLinkToExternalLink(link) {
        const linkText = link.innerText;
        const linkParts = linkText.split('/');
        const linkKey = linkParts[0].toLowerCase();
        if (embedLinks[linkKey] !== undefined) {
            link.target = '_top';
            link.href = link.getAttribute('data-voiture-original-href');
        }
    }

    function toggleConvertEmbedLinks(value) {
        const valueChanged = config.convertEmbedLinks !== value;
        config.convertEmbedLinks = value;

        if (valueChanged) {
            const links = document
                .querySelector('#chat-win-main .chat-lines')
                .querySelectorAll('a.externallink.bookmarklink');
            for (const link of links) {
                if (config.convertEmbedLinks) {
                    convertEmbedLinkToExternalLink(link);
                } else {
                    unconvertEmbedLinkToExternalLink(link);
                }
            }
        }

        saveConfig();
    }

    /******************************************/
    /* Hide Chat ******************************/
    /******************************************/

    function toggleHideChat(value) {
        if (value !== undefined) {
            chatHidden = value;
        } else {
            chatHidden = !chatHidden;
        }

        if (chatHidden) {
            document.getElementById('chat-output-frame').style.visibility = 'hidden';
            document.getElementById('chat-hide-btn').querySelector('span').innerText = 'o';
            document.getElementById('chat-hide-btn').setAttribute('title', 'Show chat');
        } else {
            document.getElementById('chat-output-frame').style.visibility = 'unset';
            document.getElementById('chat-hide-btn').querySelector('span').innerText = 'ø';
            document.getElementById('chat-hide-btn').setAttribute('title', 'Hide chat');
        }
    }

    /******************************************/
    /* 🦃 goblgobl ****************************/
    /******************************************/

    function generateGoblMessage() {
        let message = goblIcon + ' gobl' + shuffleString('gobl');
        if (Math.random() < 0.5) {
            message += shuffleString('gobl');
            if (Math.random() < 0.25) {
                message += shuffleString('gobl');
            }
        }
        return message;
    }

    /******************************************/
    /* Fix Twitter Links **********************/
    /******************************************/

    function fixTwitterLinks(link) {
		let fixedUrl = link.href;
		let urlChanged = false;
		const twitterMobileRegex = /((http|https):\/\/)?(mobile\.)(twitter\.com)/;
		const twitterQueryRegex = /((http|https):\/\/)?((www|mobile)\.)?(twitter\.com\/)(.+)(\?s=\d+)/;
		if (twitterMobileRegex.test(link.href)) {
			fixedUrl = fixedUrl.replace('mobile.', '');
			urlChanged = true;
		}
		if (twitterQueryRegex.test(link.href)) {
			fixedUrl = link.href.split('?')[0];
			urlChanged = true;
		}

		if (urlChanged === true) {
			// DEBUG
			//console.info(link, link.href + ' --> ' + fixedUrl);
			//link.style = 'box-shadow: 0px 0px 5px 0px;border-radius: 10px;padding: 0px 5px;';

			link.href = fixedUrl;
			//link.innerText = fixedUrl;
		}
    }

    /******************************************/
    /* GUI ************************************/
    /******************************************/

    function baseInjections() {
        document.getElementById('chat-output-frame').addEventListener('mousedown', emoteClick);
    }

    function injectToolbarButtons() {
        let htmlLeft = '';
        let htmlRight = '';
        let css = '<style>';

        // Adjust some styles
        css += `
			.msg-highlight, .msg-whisper {
				position: sticky;
				top: 0px;
				z-index: 121;
			}
			#chat {
				overflow-x: hidden;
			}
			#chat-tools-wrap {
				overflow: hidden;
			}
			#chat-whisper-btn {
				margin-right: 0.6em;
			}
			.emote-scaling-wrapper {
				transform: scale(0.7);
				white-space: nowrap;
			}
            .hidden {
                display: none !important;
            }
			#chat-tools-wrap .chat-tool-btn {
				width: unset;
				min-width: 2.25em;
                cursor: pointer;
            }
            #chat-tools-wrap .voiture-btn-icon {
                float: left;
                font-style: normal;
                white-space: nowrap;
                text-align: center;
                color: white;
                font-weight: bold;
            }
            #chat-tools-wrap .chat-tools-group:first-child .voiture-btn-icon {
                margin-top: 2px;
            }
            #chat-tools-wrap .voiture-chat-tool-btn {
                opacity: 0.25;
                transition: opacity 150ms;
                color: white;
                min-width: unset;
            }
            #chat-tools-wrap > .chat-tools-group:first-child .voiture-chat-tool-btn {
                border-left: unset;
                border-right: unset;
            }
            #chat-tools-wrap .voiture-chat-tool-btn:hover {
                opacity: 1;
            }
            #chat-tools-wrap #chat-👞👞-btn > i.voiture-btn-icon {
                font-weight: normal;
                font-size: 80%;
                margin-top: 7px;
            }
            .msg-chat .chat-user {
                background: rgba(255,255,255,0.08);
                padding: 2px;
                margin: -2px;
                border-radius: 3px;
            }
            .msg-chat .chat-user:hover {
                background: rgba(255,255,255,0.12);
            }
            `;


        // nathanTiny2
        htmlLeft += `
		<a id="chat-nathanTiny2-btn" class="chat-tool-btn voiture-chat-tool-btn ${config.showVerticalComboButtons ? '' : 'hidden'}" title="___ nathanTiny2">
			<div class="emote-scaling-wrapper">
				<i class="voiture-btn-icon emote nathanTiny2_OG"></i>
			</div>
		</a>`;

        // 👞👞
        htmlLeft += `
		<a id="chat-👞👞-btn" class="chat-tool-btn voiture-chat-tool-btn ${config.showVerticalComboButtons ? '' : 'hidden'}" title="___ 👞👞">
            <i class="voiture-btn-icon">👞👞</i>
		</a>`;

        // 🦃 goblgobl
        if(goblIcon === TURKEY_EMOTE) {
            htmlLeft += `
            <a id="chat-gobl-btn" class="chat-tool-btn voiture-chat-tool-btn" title="🦃 goblgobl">
                <div class="emote-scaling-wrapper">
                    <i class="voiture-btn-icon emote ${TURKEY_EMOTE}"></i>
                </div>
            </a>`;
        } else {
            htmlLeft += `
            <a id="chat-gobl-btn" class="chat-tool-btn voiture-chat-tool-btn" title="🦃 goblgobl">
                <i class="voiture-btn-icon">🦃</i>
            </a>`;
        }

        // Emote Back
        htmlLeft += `
		<a id="chat-emote-back-btn" class="chat-tool-btn voiture-chat-tool-btn">
			<div class="emote-scaling-wrapper">
				<i class="voiture-btn-icon emote"></i>
			</div>
		</a>`;

        // Mentions
        htmlRight += `
        <a id="chat-mentions-btn" class="chat-tool-btn voiture-chat-tool-btn" title="Open mentions window" target="_blank" rel="noreferrer noopener" href="https://polecat.me/mentions">
            <span class="voiture-btn-icon" style="pointer-events: none;margin-top: 1px;">@</span>
        </a>`;

        // Hide Chat
        htmlRight += `
        <a id="chat-hide-btn" class="chat-tool-btn voiture-chat-tool-btn" title="Hide chat">
            <span class="voiture-btn-icon">ø</span>
        </a>`;
        css += `
        #chat-tools-wrap #chat-hide-btn .voiture-btn-icon {
            font-size: 22px;
            line-height: 20px;
            font-weight: normal;
        }`;

        css += '</style>';

        document.querySelector('#chat-tools-wrap > .chat-tools-group:first-child').insertAdjacentHTML('beforeend', htmlLeft);
        document.querySelector('#chat-tools-wrap > .chat-tools-group:last-child').insertAdjacentHTML('afterbegin', htmlRight);
        document.head.insertAdjacentHTML('beforeend', css);

        // add event listeners
        document.getElementById('chat-nathanTiny2-btn').addEventListener('click', e => sendChatMessage(getEmoteAlignedMessage('nathanTiny2_OG')));
        document.getElementById('chat-👞👞-btn').addEventListener('click', e => sendChatMessage(getEmoteAlignedMessage('👞👞')));
        document.getElementById('chat-gobl-btn').addEventListener('mouseup', e => {
            if (e.button === LEFT_CLICK || e.button === MIDDLE_CLICK)
            {
                const autoSend = (e.button === MIDDLE_CLICK);
                addToChatBox(generateGoblMessage(), autoSend);
            }
        });
        addEmoteBackListeners();
        document.getElementById('chat-mentions-btn').addEventListener('click', e => {
            e.preventDefault();
            if (mentionsWindow === null || mentionsWindow.closed) {
                mentionsWindow = window.open(
                    e.target.href,
                    '',
                    'location,width=770,height=500',
                );
            }
            mentionsWindow.focus();
        });
        document.getElementById('chat-hide-btn').addEventListener('click', e => {
            e.preventDefault();
            toggleHideChat();
        });
    }

    function addEmoteBackListeners() {
        document.getElementById('chat-emote-back-btn').addEventListener('wheel', e => {
            scrollEmoteMentions(-1 * Math.sign(e.deltaY));
        });
        document.getElementById('chat-emote-back-btn').addEventListener('mouseup', e => {
            if (e.button === MIDDLE_CLICK)
                clearEmoteBackButton();
        });
    }

    function injectOptions() {
        let html = '<h4>D.GG Extra Features</h4>';
        let css = '<style>';

        // Theme
        html += `
		<div class="form-group checkbox">
            <label title="Set chat theme (Credit to Igor for the light theme styles)" for="voiture-options-theme">
                Theme
            </label>
            <select id="voiture-options-theme" name="voiture-options-theme" class="form-control">
                <option value="dark" ${(config.theme !== 'light' ? 'selected' : '')}>Dark (Default)</option>
                <option value="light" ${(config.theme === 'light' ? 'selected' : '')}>Light</option>
            </select>
		</div>`;

        // Auto-message
        html += `
		<div class="form-group checkbox">
			<label title="Automatically send messages or preview message in textbox">
				<input id="voiture-options-auto-message" name="voiture-options-auto-message" type="checkbox" ${
                    config.autoSendMessages ? 'checked' : ''
                }>
				Auto-message
			</label>
		</div>`;

        // Emote click
        html += `
		<div class="form-group checkbox">
			<label title="Clicking emotes in chat puts emote in your message">
				<input id="voiture-options-emote-click" name="voiture-options-emote-click" type="checkbox" ${
                    config.clickableEmotes ? 'checked' : ''
                }>
				Emote Click
			</label>
		</div>`;

        // Convert embed links
        html += `
		<div class="form-group checkbox">
			<label title="Embed links like #twitch/destiny will be changed to open a new window for twitch.tv/destiny">
				<input id="voiture-options-convert-embed-links" name="voiture-options-convert-embed-links" type="checkbox" ${
                    config.convertEmbedLinks ? 'checked' : ''
                }>
				Convert Embed Links
			</label>
		</div>`;

        // Show vertical combo buttons
        html += `
		<div class="form-group checkbox">
			<label title="show/hide the buttons for the nathanTiny2 and 👞👞 combos">
				<input id="voiture-options-show-vertical-combo-buttons" name="voiture-options-show-vertical-combo-buttons" type="checkbox" ${
                    config.showVerticalComboButtons ? 'checked' : ''
                }>
				Show Vertical Combo Buttons
			</label>
		</div>`;

        // Measure message starting left
        html += `
		<div class="form-group row">
			<label title="Automatically send messages or preview message in textbox">Message starting left</label>
				<div class="row">
				<button id="voiture-options-starting-left-calculate" class="btn btn-dark">Calculate</button>
					<input id="voiture-options-starting-left" name="voiture-options-starting-left" class="form-control" value="${config.messageStartingLeft}" readonly>
				</div>
			</label>
		</div>`;

        css += `
		button.btn-dark {
			color: #DEDEDE;
			background: #030303;
			padding: 0.3em 0.5em;
			margin-top: -2px;
			border: none;
		}`;

        css += '</style>';

        document.getElementById('chat-settings-form').insertAdjacentHTML('beforeend', html);
        document.head.insertAdjacentHTML('beforeend', css);

        // add event listeners
        document.getElementById('voiture-options-theme').addEventListener('change', e => changeTheme(e.target.value));
        document.getElementById('voiture-options-auto-message').addEventListener('change', e => toggleAutoSendMessages(e.target.checked));
        document.getElementById('voiture-options-emote-click').addEventListener('change', e => toggleEmoteClicks(e.target.checked));
        document.getElementById('voiture-options-convert-embed-links').addEventListener('change', e => toggleConvertEmbedLinks(e.target.checked));
        document.getElementById('voiture-options-show-vertical-combo-buttons').addEventListener('change', e => showVerticalComboButtons(e.target.checked));
        document.getElementById('voiture-options-starting-left-calculate').addEventListener('click', saveMessageStartingLeft);
    }

    function saveMessageStartingLeft() {
        config.messageStartingLeft = getOwnStartingLeft(config.username);
        document.getElementById('voiture-options-starting-left').value = config.messageStartingLeft;
        saveConfig();
    }

    /******************************************/
    /* Config Handling ************************/
    /******************************************/

    function loadConfig() {
        const json = localStorage.getItem('voiture-dgg-extra-features');
        const savedConfig = JSON.parse(json);
        Object.assign(config, savedConfig);

        // Verify username matches config, if it is different set correct username and save config for next time
        // Need to wait for it to load... sigh
        setTimeout(() => {
            // Get username (current gets it from chatbox placeholder, hopefully there is a better way to do this)
            const username = document.getElementById('chat-input-control')
                .getAttribute('placeholder')
                .replace('Write something ', '')
                .replace('...', '')
                .trim();
            if (username !== config.username) {
                config.username = username;
                saveConfig();
            }
        }, 1000);
    }

    function saveConfig() {
        const json = JSON.stringify(config);
        localStorage.setItem('voiture-dgg-extra-features', json);
    }

    /******************************************/
    /* Main Code To Run ***********************/
    /******************************************/

    function main() {
        loadConfig();

        baseInjections();
        injectToolbarButtons();
        injectOptions();
        observeChat();
        addLightThemeStyle();
    }

    main();
})();

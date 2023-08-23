// TALK TO CHATGPT
// ---------------
// Author		: Bereket Tewoldeberhan
// Version		: 0.1

// Indicate a locale code such as 'fr-FR', 'en-US', to use a particular language for the speech recognition functionality (when you speak into the mic)
// If you leave this blank, the system's default language will be used
let CN_WANTED_LANGUAGE_SPEECH_REC = ""; //"fr-FR";
let CN_SAY_THIS_TO_CLEAR_BOX = "clear box";
// Determine which word(s) will cause this script to send the current message (if auto-send disabled)
let CN_SAY_THIS_TO_SEND = "send message now"; 

// -------------------
// CODE (DO NOT ALTER)
// -------------------
let CN_SPEECHREC = null;
let CN_IS_LISTENING = false;
let CN_FINISHED = false;
let CN_PAUSED = false;
let CN_TIMEOUT_KEEP_SPEECHREC_WORKING = null;
let CN_SPEECH_REC_SUPPORTED = false;
let CN_SPEECHREC_DISABLED = false;

// Send a message to the bot (will simply put text in the textarea and simulate a send button click)
function CN_SendMessage(text) {
	// Put message in textarea
	jQuery("div.input-group textarea#user-input").focus();
	let existingText = jQuery("div.input-group textarea#user-input").val();
	
	// Is there already existing text?
	if (!existingText) CN_SetTextareaValue(text);
	else CN_SetTextareaValue(existingText+" "+text);
	
	// Change height in case
	let fullText = existingText+" "+text;
	let rows = Math.ceil( fullText.length / 88);
	let height = rows * 24;
	jQuery("div.input-group textarea#user-input").css("height", height+"px");
	 
	// No autosend, so continue recognizing
	clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
	CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);

}

// Start speech recognition using the browser's speech recognition API
function CN_StartSpeechRecognition() {
	if (!CN_SPEECH_REC_SUPPORTED) return;
	CN_SPEECHREC = ('webkitSpeechRecognition' in window) ? new webkitSpeechRecognition() : new SpeechRecognition();
	CN_SPEECHREC.continuous = true;
	CN_SPEECHREC.lang = CN_WANTED_LANGUAGE_SPEECH_REC;
	CN_SPEECHREC.onstart = () => {
		// Make bar red
		$("#CNStatusBar").css("background", "red");		
		CN_IS_LISTENING = true;
		console.log("I'm listening");
	};
	CN_SPEECHREC.onend = () => {
		// Make border grey again
		$("#CNStatusBar").css("background", "grey");		
		CN_IS_LISTENING = false;
		console.log("I've stopped listening");
	};
	CN_SPEECHREC.onerror = (event) => {
		CN_IS_LISTENING = false;
		console.log("Error while listening:", event.error);
	  };
	CN_SPEECHREC.onresult = (event) => {
		let final_transcript = "";
		for (let i = event.resultIndex; i < event.results.length; ++i) {
			if (event.results[i].isFinal)
				final_transcript += event.results[i][0].transcript;
		}		
		console.log("Voice recognition: '"+ (final_transcript)+"'");
		
		// Empty? https://github.com/C-Nedelcu/talk-to-chatgpt/issues/72
		if (final_transcript.trim() == "") {
			console.log("Empty sentence detected, ignoring");
			return;
		}

		// Check for "send message now" command
		if (CN_RemovePunctuation(final_transcript) == CN_SAY_THIS_TO_SEND.toLowerCase().trim()) {
			console.log("send message now detected ...")
			// Trigger the send action (assuming there's a button for sending with an identifiable selector)
			jQuery('button[title="Submit Message"]').click(); 
	
			// Clear the textarea
			jQuery("div.input-group textarea#user-input").val('');
			return;
		}

		// Check for "clear box" command
		if (CN_RemovePunctuation(final_transcript) == CN_SAY_THIS_TO_CLEAR_BOX.toLowerCase().trim()) {
			// Clear the textarea
			jQuery("div.input-group textarea#user-input").val('');
			return;
		}
	
		// Send the message
		CN_SendMessage(final_transcript);
	};
	if (!CN_IS_LISTENING && CN_SPEECH_REC_SUPPORTED && !CN_SPEECHREC_DISABLED) CN_SPEECHREC.start();
	clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
	CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
}

// Make sure the speech recognition is turned on when the bot is not speaking
function CN_KeepSpeechRecWorking() {
	if (CN_FINISHED) return; // Conversation finished
	clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
	CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
	if (!CN_IS_LISTENING && !CN_PAUSED) {
		if (!CN_SPEECHREC)
			CN_StartSpeechRecognition();
		else {
			if (!CN_IS_LISTENING) {
				try {
					if (CN_SPEECH_REC_SUPPORTED && !window.speechSynthesis.speaking && !CN_SPEECHREC_DISABLED)
						CN_SPEECHREC.start();
				} catch(e) { }
			}
		}
	}
}

// Toggle button clicks: settings, pause, skip...
function CN_ToggleButtonClick() {
	var action = $(this).data("cn");
	switch(action) {
	
		// Open settings menu
		case "settings":
			CN_OnSettingsIconClick();
			return;
		
		// The microphone is on. Turn it off
		case "micon":
			// Show other icon and hide this one
			$(this).css("display", "none");
			$(".CNToggle[data-cn=micoff]").css("display", "");
			
			// Disable speech rec
			CN_SPEECHREC_DISABLED = true;
			if (CN_SPEECHREC && CN_IS_LISTENING) CN_SPEECHREC.stop();
			
			return;
		
		// The microphone is off. Turn it on
		case "micoff":
			// Show other icon and hide this one
			$(this).css("display", "none");
			$(".CNToggle[data-cn=micon]").css("display", "");
			
			// Enable speech rec
			CN_SPEECHREC_DISABLED = false;
			if (CN_SPEECHREC && !CN_IS_LISTENING) CN_SPEECHREC.start();
			
			return;
	}
}


function CN_SetTextareaValue(text) {
    const textarea = jQuery("div.input-group textarea#user-input")[0];
    function setNativeValue(element, value) {
      const { set: valueSetter } = Object.getOwnPropertyDescriptor(element, 'value') || {}
      const prototype = Object.getPrototypeOf(element)
      const { set: prototypeValueSetter } = Object.getOwnPropertyDescriptor(prototype, 'value') || {}

      if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value)
      } else if (valueSetter) {
        valueSetter.call(element, value)
      } else {
        throw new Error('The given element does not have a value setter')
      }
    }
    setNativeValue(textarea, text)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
}

// Start Talk-to-ChatGPT (Start button)
function CN_StartTTGPT() {
	// Play sound & start
	var snd = new Audio("data:audio/mpeg;base64,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");
	snd.play();
	CN_FINISHED = false;
	
	// Hide start button, show action buttons
	jQuery(".CNStartZone").hide();
	jQuery(".CNActionButtons").show();
	
	setTimeout(function() {
		// Start speech rec
		CN_StartSpeechRecognition();	
	}, 250);
}

// Check we are on the correct page
function CN_CheckCorrectPage() {
	console.log("Checking we are on the correct page...");
	var wrongPage = jQuery("div.input-group textarea#user-input").length == 0; // no textarea... login page?  $("div.input-group textarea#user-input")
	
	if (wrongPage) {
		// We are on the wrong page, keep checking
		setTimeout(CN_CheckCorrectPage, 1000);
	} else {
		// We are on the right page, let's go!
		CN_InitScript();
	}
}

// Perform initialization after jQuery is loaded
function CN_InitScript() {
	if (typeof $ === null || typeof $ === undefined) $ = jQuery;
	
	var warning = "";
	if ('webkitSpeechRecognition' in window) {
		console.log("Speech recognition API supported");
		CN_SPEECH_REC_SUPPORTED = true;
	} else {
		console.log("speech recognition API not supported.");
		CN_SPEECH_REC_SUPPORTED = false;
		warning = "\n\nWARNING: speech recognition (speech-to-text) is only available in Chromium-based browsers - desktop version at the moment. If you are using another browser, you will not be able to dictate text, but you can still listen to the bot's responses.";
	}
	
	// Restore settings
	CN_RestoreSettings();
	
	// Add icons on the top right corner
	jQuery("body").append(
		"<div style='position: fixed; top: 8px; right: 16px; display: inline-block; " +
			"background: #41464c; color: white; padding: 0; font-size: 16px; border-radius: 8px; text-align: center;" +
			"cursor: move; font-weight: bold; z-index: 1111;' id='TTGPTSettings'>" +
			// Logo / title
			"<div style='padding: 4px 40px; border-bottom: 1px solid grey;'>" +		
					"Talk to C.ai" +
			"</div>" +			
			// Below logo
			"<div>" +
				
				// Start button
				"<div style='font-size: 16px; padding: 8px;' class='CNStartZone'>" +
					"<button style='border: 2px solid grey; padding: 6px 40px; margin: 6px; border-radius: 6px; opacity: 0.7;' id='CNStartButton' title='ALT+SHIFT+S'><i class=\"fa-solid fa-play\"></i>&nbsp;&nbsp;START</button>"+
				"</div>"+
		
				// Action buttons
				"<div style='font-size: 20px; padding: 12px 8px; padding-bottom: 0px; display:none;' class='CNActionButtons'>" +
					"<table width='100%' cellpadding=0 cellspacing=0><tr>" +
						"<td width='24%' style='text-align: center;'>" +
							"<span class='CNToggle' title='Voice recognition enabled. Click to disable. (Shortcut: ALT+SHIFT+H)' data-cn='micon' style='opacity: 0.7;'><i class=\"fa-solid fa-microphone\"></i></span>" + // Microphone enabled
							"<span class='CNToggle' title='Voice recognition disabled. Click to enable. (Shortcut: ALT+SHIFT+H)' style='display:none; color: red; opacity: 0.7;' data-cn='micoff'><i class=\"fa-solid fa-microphone-slash\"></i></span>" + // Microphone disabled
						"</td>" +
						"<td width='24%' style='text-align: center;'>" +
							"<span class='CNToggle' title='Settings' data-cn='settings' style='opacity: 0.7;'><i class=\"fa-solid fa-keyboard\"></i></span>" + 					
						"</td>" +
					"</tr></table>" +
					
					// Colored bar - transparent by default, red when mic on, green when bot speaks
					"<div style='padding-top: 12px; padding-bottom: 6px;'>" +
						"<div id='CNStatusBar' style='background: grey; width: 100%; height: 8px; border-radius: 4px; overflow: hidden;'>&nbsp;</div>" +
					"</div>" +
		
					// Pause bar - click button to resume
					"<div style='padding-top: 12px; padding-bottom: 12px; display: none;' id='CNSuspendedArea'>" +
						"<div style='font-size: 11px; color: grey;'><b>CONVERSATION PAUSED</b><br />Click button below or speak the pause word to resume</div>" +
						"<div style='padding: 10px;'>" +
							"<button style='font-size: 13px; border: 2px solid grey; padding: 6px 40px; margin: 6px; border-radius: 6px; opacity: 0.7;' id='CNResumeButton'><i class=\"fa-solid fa-play\"></i>&nbsp;&nbsp;RESUME</button>" +
						"</div>" +
					"</div>" +
					
		"</div>" +
			"</div>" +
		"</div>"
	);
	
	setTimeout(function () {
		// Try and get voices
		speechSynthesis.getVoices();

		// Make icons clickable
		jQuery(".CNToggle").css("cursor", "pointer");
		jQuery(".CNToggle").on("click", CN_ToggleButtonClick);
		jQuery("#CNStartButton").on("click", CN_StartTTGPT);
		
		// Make icons change opacity on hover
		jQuery(".CNToggle, #CNStartButton, #CNResumeButton").on("mouseenter", function() { jQuery(this).css("opacity", 1); });
		jQuery(".CNToggle, #CNStartButton, #CNResumeButton").on("mouseleave", function() { jQuery(this).css("opacity", 0.7); });
		jQuery(document).on("mouseenter", ".TTGPTSave, .TTGPTCancel", function() { jQuery(this).css("opacity", 1); } );
		jQuery(document).on("mouseleave", ".TTGPTSave, .TTGPTCancel", function() { jQuery(this).css("opacity", 0.7); } );
		
		// Make TTGPTSettings draggable
		jQuery("#TTGPTSettings").mousedown(function(e) {
			window.my_dragging = {};
			my_dragging.pageX0 = e.pageX;
			my_dragging.pageY0 = e.pageY;
			my_dragging.elem = this;
			my_dragging.offset0 = $(this).offset();
			function handle_dragging(e) {
				var left = my_dragging.offset0.left + (e.pageX - my_dragging.pageX0);
				var top = my_dragging.offset0.top + (e.pageY - my_dragging.pageY0);
				jQuery(my_dragging.elem).css('right', '');
				jQuery(my_dragging.elem)
					.offset({top: top, left: left});
			}
			function handle_mouseup(e) {
				jQuery('body')
					.off('mousemove', handle_dragging)
					.off('mouseup', handle_mouseup);
			}
			jQuery('body')
				.on('mouseup', handle_mouseup)
				.on('mousemove', handle_dragging);
		});
	}, 100);
}

// Open settings menu
function CN_OnSettingsIconClick() {
	console.log("Opening settings menu");
	var rows = "<h2>Voice control</h2>";
	rows += "<table width='100%' cellpadding=6 cellspacing=2 style='margin-top: 15px;'>";
	rows += "<tr><td style='white-space: nowrap'>Manual send word(s):</td><td><input type=text id='TTGPTSendWord' style='width: 250px; padding: 2px; color: black;' value='" + CN_SAY_THIS_TO_SEND + "' /><span style='font-size: 10px;'>you can trigger the sending of the message by saying this word (or sequence of words)</span></td></tr>";
	rows += "<tr><td style='white-space: nowrap'>Manual send word(s):</td><td><input type=text id='TTGPTClearBox' style='width: 250px; padding: 2px; color: black;' value='" + CN_SAY_THIS_TO_CLEAR_BOX + "' /><span style='font-size: 10px;'>you can trigger the sending of the message by saying this word (or sequence of words)</span></td></tr>";
	rows += "<tr><td colspan=2 style='text-align: center'><br />" +
		"<button class='TTGPTSave' style='border: 2px solid grey; border-radius: 4px; padding: 6px 24px; font-size: 18px; font-weight: bold; opacity: 0.7;'>✓ Save</button>&nbsp;" +
		"<button class='TTGPTCancel' style='border: 2px solid grey; border-radius: 4px; padding: 6px 24px; margin-left: 40px; font-size: 18px; opacity: 0.7;'>✗ Cancel</button></td></tr></table>";
	
	// Open a whole screenful of settings
	jQuery("body").append("<div style='background: rgba(0,0,0,0.8); position: absolute; overflow-y: auto; top: 0; right: 0; left: 0; bottom: 0; z-index: 999999; padding: 20px; color: white; font-size: 13px;' id='TTGPTSettingsArea'>" +
		"<div style='width: 600px; margin-left: auto; margin-right: auto; overflow-y: auto;'><h1>⚙️ Talk-to-ChatGPT settings</h1>"+rows+"</div></div>");
	
	// Assign events
	setTimeout(function() {
		jQuery(".TTGPTSave").on("click", CN_SaveSettings);
		jQuery(".TTGPTCancel").on("click", CN_CloseSettingsDialog);
					
	}, 100);
}

// Save settings and close dialog box
function CN_SaveSettings() {
	
	// Save settings
	try {
		CN_SAY_THIS_TO_SEND = CN_RemovePunctuation( jQuery("#TTGPTSendWord").val() );
		CN_SAY_THIS_TO_CLEAR_BOX = CN_RemovePunctuation( jQuery("#TTGPTClearBox").val() );
		// Save settings in cookie
		var settings = [
			CN_SAY_THIS_TO_SEND,
			CN_SAY_THIS_TO_CLEAR_BOX
		];
		CN_SetCookie("CN_TTGPT", JSON.stringify(settings));
	} catch(e) { alert('Invalid settings values. '+e.toString()); return; }
	
	// Close dialog
	console.log("Closing settings dialog");
	jQuery("#TTGPTSettingsArea").remove();
	
	// Resume listening
	CN_PAUSED = false;
}

// Restore settings from cookie
function CN_RestoreSettings() {
	var settingsRaw = CN_GetCookie("CN_TTGPT");
	try {
		var settings = JSON.parse(settingsRaw);
		if (typeof settings == "object" && settings != null) {
			console.log("Reloading settings from cookie: "+settings);
			if (settings.hasOwnProperty(0)) CN_SAY_THIS_TO_SEND = settings[0];
			if (settings.hasOwnProperty(1)) CN_SAY_THIS_TO_CLEAR_BOX = settings[1];
		}
	} catch (ex) {
		console.error(ex);
	}
}

// Close dialog: remove area altogether
function CN_CloseSettingsDialog() {
	console.log("Closing settings dialog");
	jQuery("#TTGPTSettingsArea").remove();
	
	// Resume listening
	CN_PAUSED = false;
}

// Remove punctuation in a sentence. This function was written by ChatGPT on the 9th of April 2023. Thanks Chatty!
function CN_RemovePunctuation(str) {
	const regexPonctuation = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@\[\]^_`{|}~]/g;
	str = str.replace(regexPonctuation, '')+"";
	return str.toLowerCase().trim();
}

// Sets a cookie
function CN_SetCookie(name, value) {
	var days = 365;
	var date = new Date();
	date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
	var expires = "; expires=" + date.toGMTString();
	document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}

// Reads a cookie
function CN_GetCookie(name) {
	let nameEQ = encodeURIComponent(name) + "=";
	let ca = document.cookie.split(';');
	for (const element of ca) {
		var c = element;
		while (c.charAt(0) === ' ')
			c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) === 0)
			return decodeURIComponent(c.substring(nameEQ.length, c.length));
	}
	return null;
}

// MAIN ENTRY POINT
// Load jQuery, then run initialization function
(function () {
	
	setTimeout(function() {
		typeof jQuery == "undefined" ?
			alert("[Talk-to-ChatGPT] Sorry, but jQuery was not able to load. The script cannot run. Try using Google Chrome or Edge on Windows 11") :
			CN_CheckCorrectPage();
	}, 500);
	
})();

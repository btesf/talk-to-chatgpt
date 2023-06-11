// TALK TO CHATGPT
// ---------------
// Author		: Bereket Tewoldeberhan
// Version		: 0.1





// Do we keep listening even when paused, so that we can resume by a vocal command?
var CN_KEEP_LISTENING = true;

// Determine which word(s) will cause this script to send the current message (if auto-send disabled)
var CN_SAY_THIS_TO_SEND = "send message now"; 
var CN_SAY_THIS_TO_CLEAR = "clear message box"
var CN_WANTED_LANGUAGE_SPEECH_REC = "en-US"; //"fr-FR";
// Determine whether messages are sent immediately after speaing
var CN_AUTO_SEND_AFTER_SPEAKING = true;
// ----------------------------


// -------------------
// CODE (DO NOT ALTER)
// -------------------
var CN_MESSAGE_COUNT = 0;
var CN_CURRENT_MESSAGE = null;
var CN_CURRENT_MESSAGE_SENTENCES = [];
var CN_CURRENT_MESSAGE_SENTENCES_NEXT_READ = 0;
var CN_SPEECHREC = null;
var CN_IS_READING = false;
var CN_IS_LISTENING = false;
var CN_FINISHED = false;
var CN_PAUSED = false;
var CN_WANTED_VOICE = null;
var CN_TIMEOUT_KEEP_SYNTHESIS_WORKING = null;
var CN_TIMEOUT_KEEP_SPEECHREC_WORKING = null;
var CN_SPEECH_REC_SUPPORTED = false;
var CN_SPEAKING_DISABLED = false;
var CN_SPEECHREC_DISABLED = false;
var CN_CONVERSATION_SUSPENDED = false;
var CN_BAR_COLOR_FLASH_GREY = false;
var CN_TTS_ELEVENLABS_QUEUE = [];
var CN_IS_CONVERTING = false;
var CN_IS_PLAYING = false;
var CN_CURRENT_AUDIO = null;

// Send a message to the bot (will simply put text in the textarea and simulate a send button click)
function CN_SendMessage(text) {
	// Put message in textarea
	jQuery("div.input-group textarea#user-input").focus();
	var existingText = jQuery("div.input-group textarea#user-input").val();
	
	// Is there already existing text?
	if (!existingText) CN_SetTextareaValue(text);
	else CN_SetTextareaValue(existingText+" "+text);
	
	// Change height in case
	var fullText = existingText+" "+text;
	var rows = Math.ceil( fullText.length / 88);
	var height = rows * 24;
	jQuery("div.input-group textarea#user-input").css("height", height+"px");
	 
	// No autosend, so continue recognizing
	clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
	CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
}

// Resume after suspension
function CN_ResumeAfterSuspension() {
	// Make a beep sound
	setTimeout(function () {
		// Credits: https://freesound.org/people/plasterbrain/sounds/419493/
		var snd = new Audio("data:audio/mpeg;base64,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OQAgKNwAUMrdjVn1//OEZAwMVMMuzzeyLxHJgoZeFqaKXlFPKH3UMEIXmJkbmIQPBAIr2eWTvwzssgYujuBheiNzev18A/vV3Uykchs5KYpgqPhuSTYDLClSJGqR76///U0oi4f/dkhmhs/9vb//////////9x9YDhAAgG0ww//XnAJD4T4sMIgNrH/1nBBpYAe8/smSK1LMKiaJlRsA4YHzothuz/b239X+ZFP/9ZASr/kf/89////2kPav/7UCA4AG4HH79MuS+HHL//OEZA0LqMEmKzeSPBKRhkweF06YToGhUdYqBxYqmGwIgqy6BYHYYDQiYHIphYALNgadtc7yGv/DPCNgAAiQEb4qAAwiizA9WA9kPgGXJgvmiD////of/y6e//////////T///oAVGoA/N+cFTtYMdQkDi8aFO26SVt0KgPmXUghAYBwAuNFabHLmv/+dsLLRLdVN0EDwa+DYnNBM1d1vvP///+d9vsgDgz//u+7/pUCALwAMAh/94V5RDbgICwA//OEZBAKoMEoLyuzLhW5hkmeFwSYFRljARjmBJeptYtO2rLlGRALmCgIsGh2mxyx7S/+9bmniU1cpUxgUKJjMOYLpFGJErHnX////R229bKHKKv////////rIQAwCyAbDtjc85A8YWOaOSBiQRphP7LqWedkCggwt3DDgXCAMy2HqW1S2pfrHWOVKXORGa6jyYHPR61vlrmuxql7////+/pqf0/aAjf6P/////27UcXSEhQeba6OwHOP+0xPswiC//OEZA8LbGsaBjRdBRNJglG+ByBcM15o02rHgw+BcDAklaxZghd8wQDA1XoozXCp44lXrb19b//WcsGQFFgDb1KcwMIg5aFhJx04hXqA+7/9dmQKu//1//////01//+uUSBAAIANsOAN4V6lPEGBiAKGB5oaTArBpbTXaSG1uGXUaAi04tNjlvLcs/+Z6rrtaZRvABRWYDSgDWMwX0E0P///tX9/raUm6v//9fVamiwBCuAYYAu/I84hTxhw05AC//N0ZBEK7MEivxe1OBMQ0lGWDvJqD5k85ZigASar9RmagNfAqEJgLGJiICCFLrS21ikyvUYhgYR8QURyACRAOkoULNEBLyKSf9Tf/+r7/W05///+39wr////vUEgBBfgAT+eAeFPLH7SxOr4ThSwHArEn9lVDBCO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");
		snd.play();
	}, 100);
	
	// Finish alternating colors, reset to grey
	clearTimeout(CN_TIMEOUT_FLASHBAR);
	$("#CNStatusBar").css("background", "grey");
	
	// Hide suspend area
	jQuery("#CNSuspendedArea").hide();
	
	// Say OK and resume conversation
	CN_PAUSED = false;
	CN_CONVERSATION_SUSPENDED = false;
}

// Start speech recognition using the browser's speech recognition API
function CN_StartSpeechRecognition() {
	if (CN_IS_READING) {
		clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
		CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
		return;
	}
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
		var final_transcript = "";
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

		if (CN_RemovePunctuation(final_transcript) == CN_SAY_THIS_TO_SEND.toLowerCase().trim()) {
			
			if (CN_CONVERSATION_SUSPENDED) {
				console.log("Conversation is currently suspended, voice command ignored. Use the pause word to resume conversation.");
				return;
			}
			
			console.log("You said '"+ CN_SAY_THIS_TO_SEND+"' - the message will be sent");
			
			// Click button
			jQuery("#prompt-textarea").closest("div").find("button").click();

			// Send the message, if autosend is enabled //
			//jQuery("#div.input-group textarea#user-input").closest("button").find("[title|='Submit Message']").prop("disabled", false);
			let $submit_button = $("[title|='Submit Message']")
			if (CN_AUTO_SEND_AFTER_SPEAKING) {
				//jQuery("#prompt-textarea").closest("div").find("button").click();
				//jQuery("#div.input-group textarea#user-input").closest("button").find("[title|='Submit Message']").click()
				$submit_button.click()
				// Stop speech recognition until the answer is received
				//if (CN_SPEECHREC) {
				//	clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
				//	CN_SPEECHREC.stop();
				//}
			}					
			return;
		}

		else if (CN_RemovePunctuation(final_transcript) == CN_SAY_THIS_TO_CLEAR.toLowerCase().trim()) {				
			console.log("You said '"+ CN_SAY_THIS_TO_CLEAR+"' - existing text will be cleared");			
			//clear text	
			$text_box = jQuery("div.input-group textarea#user-input")
			console.log("clearing ... ")
			$text_box.val('');
			return;
		}
		
		// Are we speaking?
		if (CN_CONVERSATION_SUSPENDED) {
			console.log("Conversation is currently suspended, voice command ignored. Use the pause word to resume conversation.");
			return;
		}
		
		// Send the message
		CN_SendMessage(final_transcript);
	};
	if (!CN_IS_LISTENING && CN_SPEECH_REC_SUPPORTED && !CN_SPEECHREC_DISABLED && !CN_IS_READING) CN_SPEECHREC.start();
	clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
	CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
}

// Make sure the speech recognition is turned on when the bot is not speaking
function CN_KeepSpeechRecWorking() {
	if (CN_FINISHED) return; // Conversation finished
	clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
	CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
	if (!CN_IS_READING && !CN_IS_LISTENING && !CN_PAUSED) {
		if (!CN_SPEECHREC && !CN_IS_READING)
			CN_StartSpeechRecognition();
		else {
			if (!CN_IS_LISTENING) {
				try {
					if (CN_SPEECH_REC_SUPPORTED && !window.speechSynthesis.speaking && !CN_SPEECHREC_DISABLED && !CN_IS_READING)
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
			if (CN_SPEECHREC && !CN_IS_LISTENING && !CN_IS_READING) CN_SPEECHREC.start();
			
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
	console.log('CN_StartTTGPT ... is invoked')
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
		
		// Make sure message count starts from last; we don't want to read the latest message
		var currentMessageCount = jQuery(".text-base").length;
		if (currentMessageCount > CN_MESSAGE_COUNT) {
			// New message!
			CN_MESSAGE_COUNT = currentMessageCount;
			CN_CURRENT_MESSAGE = null; // Set current message to null
		}
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
	console.log("CN_InitScript ... started")
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
				"<a href='https://github.com/C-Nedelcu/talk-to-chatgpt' " +
					"style='display: inline-block; font-size: 20px; line-height: 80%; padding: 8px 0;' " +
					"target='_blank' title='Visit project website'>Talk to C.ai<br />" +
					"<div style='text-align: right; font-size: 12px; color: grey'>V0.1</div>" +
				"</a>" +
			"</div>" +
			
			// Below logo
			"<div>" +
				
				// Start button
				"<div style='font-size: 16px; padding: 8px;' class='CNStartZone'>" +
					"<button style='border: 2px solid grey; padding: 6px 40px; margin: 6px; border-radius: 6px; opacity: 0.7;' id='CNStartButton'><i class=\"fa-solid fa-play\"></i>&nbsp;&nbsp;START</button>"+
					"<button id='idbereket'>Button</button>" +
				"</div>"+
		
				// Action buttons
				"<div style='font-size: 20px; padding: 12px 8px; padding-bottom: 0px; display:none;' class='CNActionButtons'>" +
					"<table width='100%' cellpadding='0' cellspacing='0'><tr>" +
						"<td width='24%' style='text-align: center;'>" +
							"<span class='CNToggle' title='Voice recognition enabled. Click to disable. (Shortcut: ALT+SHIFT+H)' data-cn='micon' style='opacity: 0.7;'><i class=\"fa-solid fa-microphone\"></i></span>" + // Microphone enabled
							"<span class='CNToggle' title='Voice recognition disabled. Click to enable. (Shortcut: ALT+SHIFT+H)' style='display:none; color: red; opacity: 0.7;' data-cn='micoff'><i class=\"fa-solid fa-microphone-slash\"></i></span>" + // Microphone disabled
						"</td>" +
						"<td width='1%' style='border-left: 1px solid grey; padding-left: 0 !important; padding-right: 0 !important; font-size: 1px; width: 1px;'>&nbsp;</td>" +
						"<td width='24%' style='text-align: center;'>" +
							"<span class='CNToggle' title='Open settings menu to change bot voice, language, and other settings' data-cn='settings' style='opacity: 0.7;'><i class=\"fa-solid fa-sliders\"></i></span>" + // Settings
						"</td>"+
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
	function doAlert123(){
		alert('hi there')
	}

	setTimeout(function () {	
		console.log('setTimeout begins ...')	
		// Make icons clickable
		jQuery(".CNToggle").css("cursor", "pointer");
		jQuery(".CNToggle").on("click", CN_ToggleButtonClick);
		//jQuery("#CNStartButton").on("click", CN_StartTTGPT);
		jQuery("#CNStartButton").on("click", doAlert123);
		jQuery("#idbereket").on("click", CN_StartTTGPT);
		jQuery("#CNResumeButton").on("click", CN_ResumeAfterSuspension);
		
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
		console.log('setTimeout ends ...')	
	}, 100);
	console.log("CN_InitScript ... ended")
}

// Open settings menu
function CN_OnSettingsIconClick() {
	console.log("Opening settings menu");
	
	// Stop listening
	CN_PAUSED = true;
	if (CN_SPEECHREC) CN_SPEECHREC.stop();
	
	// Prepare settings row
	var rows = ""
	rows += "<table width='100%' cellpadding=6 cellspacing=2 style='margin-top: 15px;'>"
	// 9. Manual send word
	rows += "<tr><td style='white-space: nowrap'>Manual send word(s):</td><td><input type=text id='TTGPTSendWord' style='width: 250px; padding: 2px; color: black;' value='" + CN_SAY_THIS_TO_SEND + "' /><span style='font-size: 10px;'>If 'automatic send' is disabled, you can trigger the sending of the message by saying this word (or sequence of words)</span></td></tr>";
	
	// Prepare save/close buttons
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
		// Speech recognition settings: language, stop, pause
		CN_SAY_THIS_TO_SEND = CN_RemovePunctuation( jQuery("#TTGPTSendWord").val() );	
		
		// Save settings in cookie
		var settings = [
			CN_SAY_THIS_TO_SEND,
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

// List of languages for speech recognition - Pulled from https://www.google.com/intl/en/chrome/demos/speech.html
var CN_SPEECHREC_LANGS =
[['አማርኛ',           ['am-ET']],
 ['Deutsch',         ['de-DE']],
 ['English',         ['en-GB', 'United Kingdom'],
                     ['en-US', 'United States']]];

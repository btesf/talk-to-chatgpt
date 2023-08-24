// TALK TO CHATGPT
// ---------------
// Author		: Bereket Tewoldeberhan
// Version		: 0.1

let CN_WANTED_LANGUAGE_SPEECH_REC = "";
let CN_SAY_THIS_TO_CLEAR_BOX = "clear box";
let CN_SAY_THIS_TO_SEND = "send message now"; 

let CN_SPEECHREC = null;
let CN_IS_LISTENING = false;
let CN_FINISHED = false;
let CN_PAUSED = false;
let CN_TIMEOUT_KEEP_SPEECHREC_WORKING = null;
let CN_SPEECH_REC_SUPPORTED = false;
let CN_SPEECHREC_DISABLED = false;

function CN_SendMessage(text) {
	const textarea = document.querySelector("div.input-group textarea#user-input");
	textarea.focus();
	let existingText = textarea.value;

	if (!existingText) CN_SetTextareaValue(text);
	else CN_SetTextareaValue(existingText + " " + text);

	let fullText = existingText + " " + text;
	let rows = Math.ceil(fullText.length / 88);
	let height = rows * 24;
	textarea.style.height = height + "px";

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
		document.querySelector("#CNStatusBar").style.background = "red";		
		CN_IS_LISTENING = true;
		console.log("I'm listening");
	};
	CN_SPEECHREC.onend = () => {
		document.querySelector("#CNStatusBar").style.background = "grey";		
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
		console.log("Voice recognition: '" + (final_transcript) + "'");

		if (final_transcript.trim() == "") {
			console.log("Empty sentence detected, ignoring");
			return;
		}

		if (CN_RemovePunctuation(final_transcript) == CN_SAY_THIS_TO_SEND.toLowerCase().trim()) {
			console.log("send message now detected ...")
			document.querySelector('button[title="Submit Message"]').click(); 

			document.querySelector("div.input-group textarea#user-input").value = '';
			return;
		}

		if (CN_RemovePunctuation(final_transcript) == CN_SAY_THIS_TO_CLEAR_BOX.toLowerCase().trim()) {
			document.querySelector("div.input-group textarea#user-input").value = '';
			return;
		}

		CN_SendMessage(final_transcript);
	};

	if (!CN_IS_LISTENING && CN_SPEECH_REC_SUPPORTED && !CN_SPEECHREC_DISABLED) CN_SPEECHREC.start();
	clearTimeout(CN_TIMEOUT_KEEP_SPEECHREC_WORKING);
	CN_TIMEOUT_KEEP_SPEECHREC_WORKING = setTimeout(CN_KeepSpeechRecWorking, 100);
}

// Make sure the speech recognition is turned on when the bot is not speaking
function CN_KeepSpeechRecWorking() {
	if (CN_FINISHED) return;
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

function CN_ToggleButtonClick(event) {
	let action = event.currentTarget.getAttribute("data-cn");
	let micon = document.querySelector(".CNToggle[data-cn=micon]");
	let micoff = document.querySelector(".CNToggle[data-cn=micoff]");

	switch(action) {
		case "settings":
			CN_OnSettingsIconClick();
			return;
		case "micon":
			micon.style.display = "none";
			micoff.style.display = "";

			CN_SPEECHREC_DISABLED = true;
			if (CN_SPEECHREC && CN_IS_LISTENING) CN_SPEECHREC.stop();
			
			return;
		case "micoff":
			micoff.style.display = "none";
			micon.style.display = "";

			CN_SPEECHREC_DISABLED = false;
			if (CN_SPEECHREC && !CN_IS_LISTENING) CN_SPEECHREC.start();
			
			return;
	}
}

function CN_SetTextareaValue(text) {
    const textarea = document.querySelector("div.input-group textarea#user-input");
    textarea.value = text;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
}


function CN_StartTTGPT() {
	var snd = new Audio("data:audio/mpeg;base64,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");
	snd.play();
	CN_FINISHED = false;	
	document.querySelector(".CNStartZone").style.display = "none";
	document.querySelector(".CNActionButtons").style.display = "block";

	setTimeout(function() {
		CN_StartSpeechRecognition();	
	}, 250);
}


function CN_CheckCorrectPage() {
	console.log("Checking we are on the correct page...");
	var wrongPage = !document.querySelector("div.input-group textarea#user-input");

	if (wrongPage) {
		setTimeout(CN_CheckCorrectPage, 1000);
	} else {
		CN_InitScript();
	}
}

function checkSpeechRecognitionSupport() {
    var warning = "";
    if ('webkitSpeechRecognition' in window) {
        console.log("Speech recognition API supported");
        CN_SPEECH_REC_SUPPORTED = true;
    } else {
        console.log("speech recognition API not supported.");
        CN_SPEECH_REC_SUPPORTED = false;
        warning = "\n\nWARNING: speech recognition (speech-to-text) is only available in Chromium-based browsers - desktop version at the moment. If you are using another browser, you will not be able to dictate text, but you can still listen to the bot's responses.";
    }
}

function addUIComponents() {
    var uiHtml = "<div style='position: fixed; top: 8px; right: 16px; display: inline-block; " +
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
                            "<span class='CNToggle' title='Settings' data-cn='settings' style='opacity: 0.7;'><i class=\"fa-solid fa-gear\"></i></span>" +                     
                        "</td>" +
                    "</tr></table>" +                    
                    // Colored bar - transparent by default, red when mic on, green when bot speaks
                    "<div style='padding-top: 12px; padding-bottom: 6px;'>" +
                        "<div id='CNStatusBar' style='background: grey; width: 100%; height: 8px; border-radius: 4px; overflow: hidden;'>&nbsp;</div>" +
                    "</div>" +                
            "</div>" +
                "</div>" +
            "</div>";

    // Append to the body using pure JavaScript
    var div = document.createElement("div");
    div.innerHTML = uiHtml;
    document.body.appendChild(div.firstChild);
}


function addEventHandlers() {
    setTimeout(function() {
        // Try and get voices
        speechSynthesis.getVoices();

        // Make icons clickable
        let toggles = document.querySelectorAll(".CNToggle");
        toggles.forEach(toggle => {
            toggle.style.cursor = "pointer";
            toggle.addEventListener("click", CN_ToggleButtonClick);
        });
        
        document.getElementById("CNStartButton").addEventListener("click", CN_StartTTGPT);
        
        // Make icons change opacity on hover
        document.querySelectorAll(".CNToggle, #CNStartButton, #CNResumeButton").forEach(element => {
            element.addEventListener("mouseenter", function() { this.style.opacity = "1"; });
            element.addEventListener("mouseleave", function() { this.style.opacity = "0.7"; });
        });

        document.querySelectorAll(".TTGPTSave, .TTGPTCancel").forEach(element => {
            element.addEventListener("mouseenter", function() { this.style.opacity = "1"; });
            element.addEventListener("mouseleave", function() { this.style.opacity = "0.7"; });
        });
        
        // Make TTGPTSettings draggable
        document.getElementById("TTGPTSettings").addEventListener("mousedown", function(e) {
            window.my_dragging = {};
            my_dragging.pageX0 = e.pageX;
            my_dragging.pageY0 = e.pageY;
            my_dragging.elem = this;
            my_dragging.offset0 = this.getBoundingClientRect();

            function handle_dragging(e) {
                let left = my_dragging.offset0.left + (e.pageX - my_dragging.pageX0);
                let top = my_dragging.offset0.top + (e.pageY - my_dragging.pageY0);
                my_dragging.elem.style.right = '';
                my_dragging.elem.style.top = `${top}px`;
                my_dragging.elem.style.left = `${left}px`;
            }

            function handle_mouseup() {
                document.removeEventListener('mousemove', handle_dragging);
                document.removeEventListener('mouseup', handle_mouseup);
            }

            document.addEventListener('mouseup', handle_mouseup);
            document.addEventListener('mousemove', handle_dragging);
        });
    }, 100);
}

// Open settings menu
function CN_OnSettingsIconClick() {
    console.log("Opening settings menu");
    var rows = "<h2>Voice control</h2>";
    // ... (rest of the rows variable construction is unchanged)
	rows += "<table width='100%' cellpadding=6 cellspacing=2 style='margin-top: 15px;'>";
	rows += "<tr><td style='white-space: nowrap'>Manual send word(s):</td><td><input type=text id='TTGPTSendWord' style='width: 250px; padding: 2px; color: black;' value='" + CN_SAY_THIS_TO_SEND + "' /><span style='font-size: 10px;'>you can trigger the sending of the message by saying this word (or sequence of words)</span></td></tr>";
	rows += "<tr><td style='white-space: nowrap'>Clear textbox word(s):</td><td><input type=text id='TTGPTClearBox' style='width: 250px; padding: 2px; color: black;' value='" + CN_SAY_THIS_TO_CLEAR_BOX + "' /><span style='font-size: 10px;'>you can clear the text box by saying this word (or sequence of words)</span></td></tr>";
	rows += "<tr><td colspan=2 style='text-align: center'><br />" +
		"<button class='TTGPTSave' style='border: 2px solid grey; border-radius: 4px; padding: 6px 24px; font-size: 18px; font-weight: bold; opacity: 0.7;'>✓ Save</button>&nbsp;" +
		"<button class='TTGPTCancel' style='border: 2px solid grey; border-radius: 4px; padding: 6px 24px; margin-left: 40px; font-size: 18px; opacity: 0.7;'>✗ Cancel</button></td></tr></table>";
    // Open a whole screenful of settings
    var settingsDiv = document.createElement("div");
    settingsDiv.setAttribute("style", "background: rgba(0,0,0,0.8); position: absolute; overflow-y: auto; top: 0; right: 0; left: 0; bottom: 0; z-index: 999999; padding: 20px; color: white; font-size: 13px;");
    settingsDiv.setAttribute("id", "TTGPTSettingsArea");

    var innerDiv = document.createElement("div");
    innerDiv.setAttribute("style", "width: 600px; margin-left: auto; margin-right: auto; overflow-y: auto;");
    innerDiv.innerHTML = "<h1>⚙️ Talk-to-ChatGPT settings</h1>" + rows;
    
    settingsDiv.appendChild(innerDiv);
    document.body.appendChild(settingsDiv);

    // Assign events
    setTimeout(function() {
        var saveButtons = document.querySelectorAll(".TTGPTSave");
        saveButtons.forEach(function(btn) {
            btn.addEventListener("click", CN_SaveSettings);
        });

        var cancelButtons = document.querySelectorAll(".TTGPTCancel");
        cancelButtons.forEach(function(btn) {
            btn.addEventListener("click", CN_CloseSettingsDialog);
        });

    }, 100);
}


// Save settings and close dialog box	
function CN_SaveSettings() {
    // Save settings
    try {
        CN_SAY_THIS_TO_SEND = CN_RemovePunctuation(document.getElementById("TTGPTSendWord").value);
        CN_SAY_THIS_TO_CLEAR_BOX = CN_RemovePunctuation(document.getElementById("TTGPTClearBox").value);
        // ... (the remaining code is unchanged)
    } catch(e) {
        alert('Invalid settings values. ' + e.toString());
        return;
    }
    
    // Close dialog
    console.log("Closing settings dialog");
    document.getElementById("TTGPTSettingsArea").remove();

    // Resume listening
    CN_PAUSED = false;
}

function CN_CloseSettingsDialog() {
    console.log("Closing settings dialog");
    document.getElementById("TTGPTSettingsArea").remove();

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

function CN_InitScript() {
    checkSpeechRecognitionSupport();
    CN_RestoreSettings();
    addUIComponents();
    addEventHandlers();
}

(function () {	
	setTimeout(function() {
		!document.querySelector ? 
			alert("[C.AI] Sorry, the script cannot run. Try using Google Chrome or Edge on Windows 11") :
			CN_CheckCorrectPage();
	}, 500);	
})();


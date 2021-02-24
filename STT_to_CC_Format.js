//
// formatter
//

function timeFmt(f) {

	var t = {};
	var i = Math.floor(f);

	t.ms3 = (("" + (f - i).toPrecision(3)) + "000").substring(2, 5);

	t.s = i % 60;
	t.m = (Math.floor(i / 60)) % 60;
	t.h = Math.floor(i / 3600);
	return t;
}

function timeFmtSrt(f) {
	var t = timeFmt(f);
	return "" + ((t.h < 10) ? "0" + t.h : t.h) + ":"
			+ ((t.m < 10) ? "0" + t.m : t.m) + ":"
			+ ((t.s < 10) ? "0" + t.s : t.s) + "," + t.ms3;
}

function timeFmtVtt(f) {
	var t = timeFmt(f);
	return "" + ((t.h < 10) ? "0" + t.h : t.h) + ":"
			+ ((t.m < 10) ? "0" + t.m : t.m) + ":"
			+ ((t.s < 10) ? "0" + t.s : t.s) + "." + t.ms3;
}

function formatSrt(frames, showSpeakerLabels, cc) {
	frames.map(function(frame) {
		cc += frame.frameNumber + "\n";
		cc += timeFmtSrt(frame.start) + " --> " + timeFmtSrt(frame.end) + "\n";
		if (showSpeakerLabels) {
			cc += "Speaker " + frame.speaker + ": ";
		}
		cc += frame.words + "\n\n";
	});
	return cc;
}

function formatVtt(frames, showSpeakerLabels, cc) {
	frames.map(function(frame) {

		// console.log("SSLs",showSpeakerLabels);

		cc += frame.frameNumber + "\n";
		cc += timeFmtVtt(frame.start) + " --> " + timeFmtVtt(frame.end) + "\n";
		if (showSpeakerLabels) {
			cc += "Speaker " + frame.speaker + ": ";
		}
		cc += frame.words + "\n\n";
	});
	return cc;
}

function prologueSrt() {
	return "";
}

function prologueVtt() {
	return "WEBVTT\n\n";
}

//
// mail exposed entry point
//

function toClosedCaption(stt, style) {
	if (style === undefined) {
		style = {
			verbose : true
		};
		if (style.verbose) {
			console.log("Using default style");
		}
	}
	if (style.verbose === undefined) {
		style.verbose = true;
	}
	if (style.verbose) {
		console.log("Using verbose logging ", Date.now());
	}
	// if (style.verbose) {console.log(style);}

	if (style.timePerLine !== undefined
			&& ((typeof (style.timePerLine) !== "number"))) {
		style.timePerLine = Number.parseFloat(style.timePerLine);
	}
	
	if (style.timePerLine === undefined
			|| ((typeof (style.timePerLine) !== "number"))) {
		style.timePerLine = 2.0;
		if (style.verbose) {
			console.log("Using default line length");
		}
	}

	if (style.suppressHesitations !== undefined
			&& ((typeof (style.suppressHesitations) !== "boolean"))) {
		style.suppressHesitations = (style.suppressHesitations === "true");
		console.log("Using default hesitations");
	}
	if (style.suppressHesitations === undefined
			|| ((typeof (style.suppressHesitations) !== "boolean"))) {
		style.suppressHesitations = false;
	    console.log("Using default hesitations");
	}

	if (style.suppressSpeakerLabels !== undefined
			&& ((typeof (style.suppressSpeakerLabels) !== "boolean"))) {
		style.suppressSpeakerLabels = (style.suppressSpeakerLabels === "true");
	}
	if (style.suppressSpeakerLabels === undefined
			|| ((typeof (style.suppressSpeakerLabels) !== "boolean"))) {
		style.suppressSpeakerLabels = false;
		// console.log("Using default hesitations");
	}

	
	
	if (style.outputStyle === undefined) {
		style.outputStyle = "SRT";
		if (style.verbose) {
			console.log("Using default outputStyle");
		}
	}
	if ((style.outputStyle !== "SRT") && (style.outputStyle !== "VTT")) {
		style.outputStyle = "SRT";
		console.log("Invalid outputStyle, using default SRT");
	}

	//
	// variables
	//
	var timer = 0;
	var starttimer = 0;
	var endtimer = 1;
	var cc_out;

	var frameNumber = 0;
	var start_time = 0;
	var end_time = 0;
	var previous_end_time = -1.0;

	var speaker = 0;
	var previousSpeaker = -1;
	var currentSpeaker = 0;
	var speakers = [];

	var transcript = {
		t : "uninitialized",
		s : 0.0,
		e : 0.0
	};

	if (style.outputStyle === "VTT") {
		cc_out = prologueVtt();
	}
	if (style.outputStyle === "SRT") {
		cc_out = prologueSrt();
	}

	if (style.verbose) {
		console.log("Verbose style = ", style);
	}

	//
	// build a map of speaker labels
	//
	if (stt.speaker_labels) {
		if (style.verbose) {
			console.log("Speaker Labels were Found");
		}
		stt.speaker_labels.map(function(speakerLabel) {
			speakers["_" + speakerLabel.from] = speakerLabel.speaker;
		});
	} else {
		if (style.verbose) {
			console.log("No Speaker Labels Found");
		}
	}

	//
	// strip out all the transcripts elements into an array
	//
	var transcript = stt.results.map(function(element) {
		return element.alternatives[0].transcript.trim();
	}).map(function(element) {
		return element.split(" ");
	}).reduce(function(pv, el) {
		return pv.concat(el);
	}, []);

	//
	// strip out all the timestamp elements into an array
	//
	var timedWords = stt.results.map(function(element) {
		return element.alternatives[0].timestamps;
	}).map(function(timeStamp) {
		return (timeStamp);
	}).reduce(function(pv, el) {
		return pv.concat(el);
	}, []);

	
	//
	// substitute in "Smart" words from the transcript into the timestamps
	//
	var tIndex = -1;
	var tState = false;
	var timestamps = transcript.map(function(word) {
		tIndex++;
		if (word === timedWords[tIndex][0]) {
				tState = false;
				return timedWords[tIndex];
		} else {
			if (!tState){
				tState = true;
				timedWords[tIndex][0] = word;
				return timedWords[tIndex];
			} else {
				try {
				var xIndex = tIndex; 
				while (	timedWords[xIndex][0] !== word ) {
					xIndex++;
				}
				tIndex = xIndex;
				return timedWords[tIndex];
				} catch (e) { // next word not found, it's probably another "Smart Word"
					tState = true;
					timedWords[tIndex][0] = word;
					return timedWords[tIndex];					
				}
			}
		}
	});

	//
	// take all the timestamps and format them as Formatted close caption
	// elements
	//
	var frames = timestamps.map(function(element) {
		return (element);
	}).reduce(function(pv, el) {
		if (style.suppressHesitations) {
			if (el[0] === "%HESITATION") {
				return (pv);
			} // This formatter eats the hesitations
		}

		currentSpeaker = speakers["_" + el[1]];

		if (currentSpeaker !== previousSpeaker) {
			end_time = parseFloat(el[2]);

			if (pv[frameNumber]) {
				frameNumber++;
			} // only increment the frameNumber if it is not a new frame
			previousSpeaker = currentSpeaker;
		}

		if (parseFloat(el[1]) > end_time) {
			end_time = parseFloat(el[2]);
			if (pv[frameNumber]) { // only increment if this is not a new frame
				frameNumber++;
			}
			previousSpeaker = currentSpeaker;
		}
		
		if (!pv[frameNumber]) { // new frame?

			pv[frameNumber] = {
				words : "",
				start : el[1],
				end : el[2],
				frameNumber : frameNumber,
				speaker : speakers["_" + el[1]]
			};
			start_time = el[1];
			end_time = start_time + style.timePerLine;
		} else {
			pv[frameNumber].words += " ";
		}

		pv[frameNumber].words += el[0];
		pv[frameNumber].end = el[2];

		
		previous_end_time = parseFloat(el[2]);
		return (pv);
	}, []);
	
	for (var i = 0 ; i < frames.length-1; i++){
		frames[i].end = frames[i+1].start - 0.010;
	}

	if (style.outputStyle === "VTT") {
		cc_out = formatVtt(frames,
				((stt.speaker_labels) && (!style.suppressSpeakerLabels)),
				cc_out);
	}
	if (style.outputStyle === "SRT") {
		cc_out = formatSrt(frames,
				((stt.speaker_labels) && (!style.suppressSpeakerLabels)),
				cc_out);
	}

	return cc_out;
}

module.exports = {
	toClosedCaption : toClosedCaption
};

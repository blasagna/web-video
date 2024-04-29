'use strict'

// todo:
// - mirror video
// - measure frame rate, https://webrtchacks.com/mirror-framerate/
// - apply effects on streams, downsample? greyscale?

const videoDefaultConstraintString =
    '{\n  "width": {"min": 1000},\n  "height": {"min": 700},\n  "frameRate": 30\n}';
const audioDefaultConstraintString =
    '{\n  "sampleSize": 16,\n  "channelCount": 2,\n  "echoCancellation": true\n}';


let videoConstraints = null;
let audioConstraints = null;

let audioTrack = null;
let videoTrack = null;

const videoElement = document.getElementById("video");
const logElement = document.getElementById("log");
const supportedConstraintList = document.getElementById("supportedConstraints");
const videoConstraintEditor = document.getElementById("videoConstraintEditor");
const audioConstraintEditor = document.getElementById("audioConstraintEditor");
const videoSettingsText = document.getElementById("videoSettingsText");
const audioSettingsText = document.getElementById("audioSettingsText");

videoConstraintEditor.value = videoDefaultConstraintString;
audioConstraintEditor.value = audioDefaultConstraintString;

function getCurrentSettings() {
    if (videoTrack) {
        videoSettingsText.value = JSON.stringify(videoTrack.getSettings(), null, 2);
    }

    if (audioTrack) {
        audioSettingsText.value = JSON.stringify(audioTrack.getSettings(), null, 2);
    }
}

function buildConstraints() {
    try {
        videoConstraints = JSON.parse(videoConstraintEditor.value);
        audioConstraints = JSON.parse(audioConstraintEditor.value);
    } catch (error) {
        handleError(error);
    }
}

function startVideo() {
    buildConstraints();

    navigator.mediaDevices
        .getUserMedia({
            video: videoConstraints,
            audio: audioConstraints,
        })
        .then((stream) => {
            const audioTracks = stream.getAudioTracks();
            const videoTracks = stream.getVideoTracks();

            videoElement.srcObject = stream;

            if (audioTracks.length > 0) {
                audioTrack = audioTracks[0];
            }

            if (videoTracks.length > 0) {
                videoTrack = videoTracks[0];
            }
        })
        .then(() => {
            return new Promise((resolve) => {
                videoElement.onloadedmetadata = resolve;
            });
        })
        .then(() => {
            getCurrentSettings();
            log(`Selected video label: <code>${videoTrack.label}</code>`);
            log(`Selected audio label: <code>${audioTrack.label}</code>`);
        })
        .then(() => {
            handlePermission();
            enumerateDevices();
        })
        .catch(handleError);
}

function enumerateDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
        log("enumerateDevices() not supported.");
    } else {
        // List cameras and microphones.
        navigator.mediaDevices
            .enumerateDevices()
            .then((devices) => {
                devices.forEach((device) => {
                    log(`Found device <code>${device.kind}</code>: <code>${device.label}</code> id = <code>${device.deviceId}</code>`);
                });
            })
            .catch((err) => {
                console.error(`error enumerating devices ${err.name}: ${err.message}`);
            });
    }
}

function handlePermission() {
    navigator.permissions.query({ name: "camera" }).then((result) => {
        console.log(`camera permission: ${result.state}`);
    });
    navigator.permissions.query({ name: "microphone" }).then((result) => {
        console.log(`microphone permission: ${result.state}`);
    });
}


document.getElementById("startButton").addEventListener(
    "click",
    () => {
        startVideo();
    },
    false,
);

document.getElementById("applyButton").addEventListener(
    "click",
    () => {
        if (!videoTrack && !audioTrack) {
            startVideo();
        } else {
            buildConstraints();

            const prettyJson = (obj) => JSON.stringify(obj, null, 2);

            if (videoTrack) {
                videoTrack
                    .applyConstraints(videoConstraints)
                    .then(() => {
                        videoSettingsText.value = prettyJson(videoTrack.getSettings());
                    })
                    .catch(handleError);
            }

            if (audioTrack) {
                audioTrack
                    .applyConstraints(audioConstraints)
                    .then(() => {
                        audioSettingsText.value = prettyJson(audioTrack.getSettings());
                    })
                    .catch(handleError);
            }
        }
    },
    false,
);

document.getElementById("stopButton").addEventListener("click", () => {
    if (videoTrack) {
        videoTrack.stop();
    }

    if (audioTrack) {
        audioTrack.stop();
    }

    videoTrack = audioTrack = null;
    videoElement.srcObject = null;
});

function keyDownHandler(event) {
    if (event.key === "Tab") {
        const elem = event.target;
        const str = elem.value;

        const position = elem.selectionStart;
        const beforeTab = str.substring(0, position);
        const afterTab = str.substring(position, str.length);
        const newStr = `${beforeTab}  ${afterTab}`;
        elem.value = newStr;
        elem.selectionStart = elem.selectionEnd = position + 2;
        event.preventDefault();
    }
}

videoConstraintEditor.addEventListener("keydown", keyDownHandler, false);
audioConstraintEditor.addEventListener("keydown", keyDownHandler, false);

const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
for (const constraint in supportedConstraints) {
    if (Object.hasOwn(supportedConstraints, constraint)) {
        const elem = document.createElement("li");

        elem.innerHTML = `<code><a href='https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSupportedConstraints/${constraint}' target='_blank'>${constraint}</a></code>`;
        supportedConstraintList.appendChild(elem);
    }
}

function log(msg) {
    logElement.innerHTML += `${msg}<br>`;
}

function handleError(reason) {
    log(
        `Error <code>${reason.name}</code> in constraint <code>${reason.constraint}</code>: ${reason.message}`,
    );
}

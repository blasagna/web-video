'use strict'

// todo:
// - add info on selected device
// - mirror video
// - apply effects on streams

const videoDefaultConstraintString =
    '{\n  "width": {"min": 1000},\n  "height": {"min": 700},\n  "frameRate": 30\n}';
const audioDefaultConstraintString =
    'false';

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
        })
        .catch(handleError);
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

        elem.innerHTML = `<code><a href='https://developer.mozilla.org/docs/Web/API/MediaTrackSupportedConstraints/${constraint}' target='_blank'>${constraint}</a></code>`;
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

// todo: remove
// const constraintList = document.getElementById("supportedConstraints");
// const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();

// for (const constraint of Object.keys(supportedConstraints)) {
//     const elem = document.createElement("li");
//     elem.innerHTML = `<code>${constraint}</code>`;
//     constraintList.appendChild(elem);
// }


// let constraints = {
//     video: {
//         width: { min: 1280 },
//         height: { min: 720 },
//     }, audio: false
// };

// if (!navigator.mediaDevices?.enumerateDevices) {
//     console.log("enumerateDevices() not supported.");
// } else {
//     // List cameras and microphones.
//     navigator.mediaDevices
//         .enumerateDevices()
//         .then((devices) => {
//             devices.forEach((device) => {
//                 console.log(`${device.kind}: ${device.label} id = ${device.deviceId}`);
//             });
//         })
//         .catch((err) => {
//             console.error(`error enumerating devices ${err.name}: ${err.message}`);
//         });
// }


// let cameraSelector = document.querySelector('.btn');
// cameraSelector.addEventListener('click', function () {
//     console.log('clicked the button');
//     navigator.mediaDevices
//         .getUserMedia(constraints)
//         .then((stream) => {
//             /* use the stream */
//             console.log('got stream');
//         })
//         .catch((err) => {
//             /* handle the error */
//             console.error(`error getting media stream: ${err.name}: ${err.message}`);
//         });

// });

/* 
const displayMediaOptions = {
  video: {
    displaySurface: "browser",
  },
  audio: {
    suppressLocalAudioPlayback: false,
  },
  preferCurrentTab: false,
  selfBrowserSurface: "exclude",
  systemAudio: "include",
  surfaceSwitching: "include",
  monitorTypeSurfaces: "include",
};

async function startCapture(displayMediaOptions) {
  let captureStream;

  try {
    captureStream =
      await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
  } catch (err) {
    console.error(`Error: ${err}`);
  }
  return captureStream;
}

*/
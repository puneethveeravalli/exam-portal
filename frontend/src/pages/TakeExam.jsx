import { useState, useEffect, useRef } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./TakeExam.css";

import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

const MAX_VIOLATIONS = 5;

function TakeExam() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useAuth();

 const examData = location.state;

const attempt = examData?.attempt;

const attemptId =
  attempt?._id || attemptId || null;

const exam =
  examData?.exam ||
  (
    attempt?.exam &&
    typeof attempt.exam === "object"
      ? attempt.exam
      : null
  );

const [questions, setQuestions] = useState(
  examData?.questions || attempt?.questions || []
);
  
  // ----------------------------------------
  // STUDENT WATERMARK
  // ----------------------------------------

  const watermarkName =
    user?.name || "Exam Candidate";

  const watermarkUsername =
    user?.username || "";

  const watermarkText = watermarkUsername
    ? `${watermarkName} • ${watermarkUsername}`
    : watermarkName;

  // ----------------------------------------
  // EXAM STATE
  // ----------------------------------------

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [answers, setAnswers] =
    useState({});

  const [submitting, setSubmitting] =
    useState(false);

  const [result, setResult] =
    useState(null);

  const [submitError, setSubmitError] =
    useState("");

  const [timeRemaining, setTimeRemaining] =
    useState(null);

  const [autoSubmitting, setAutoSubmitting] =
    useState(false);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const [showFullscreenScreen, setShowFullscreenScreen] =
    useState(true);

  // ----------------------------------------
  // SECURITY
  // ----------------------------------------

  const [violationCount, setViolationCount] =
    useState(0);

  const [violationModal, setViolationModal] =
    useState(null);

  const [securityLocked, setSecurityLocked] =
    useState(false);

  // ----------------------------------------
  // CAMERA
  // ----------------------------------------

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const faceAnimationRef = useRef(null);
  const audioStreamRef = useRef(null);

const audioContextRef = useRef(null);

const analyserRef = useRef(null);

const audioAnimationRef = useRef(null);

const voiceStartedAtRef = useRef(null);

const lastVoiceViolationRef = useRef(0);
  const [cameraStatus, setCameraStatus] =
    useState("starting");

  const [faceStatus, setFaceStatus] =
    useState("Checking...");

  const [faceCount, setFaceCount] =
    useState(0);

  // ----------------------------------------
  // DEADLINE
  // ----------------------------------------

  const examDeadline =
    attempt && exam
      ? new Date(attempt.startedAt).getTime() +
        exam.duration * 60 * 1000
      : null;

  // ----------------------------------------
  // ENTER FULLSCREEN
  // ----------------------------------------

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();

      setIsFullscreen(true);
      setShowFullscreenScreen(false);

      await startCamera();
      await startVoiceMonitoring();
    } catch (error) {
      console.error(
        "Fullscreen error:",
        error
      );

      setViolationModal({
        title: "Fullscreen Required",
        message:
          "Fullscreen mode is required to continue the examination.",
        type: "fullscreen",
      });
    }
  };

  // ----------------------------------------
  // START CAMERA
  // ----------------------------------------

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        return;
      }

      setCameraStatus("starting");

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: {
              ideal: 640,
            },
            height: {
              ideal: 480,
            },
            facingMode: "user",
          },
          audio: false,
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await videoRef.current.play();
      }

      setCameraStatus("active");

      await initializeFaceDetection();
    } catch (error) {
      console.error(
        "Camera error:",
        error
      );

      setCameraStatus("blocked");

      await registerViolation(
        "CAMERA_DENIED",
        "Camera permission was denied or the camera could not be started."
      );
    }
  };
  // ----------------------------------------
// START MICROPHONE / VOICE MONITORING
// ----------------------------------------

const startVoiceMonitoring = async () => {
  try {
    if (audioStreamRef.current) {
      return;
    }

    const audioStream =
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

    audioStreamRef.current = audioStream;

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) {
      console.warn(
        "Web Audio API is not supported."
      );

      return;
    }

    const audioContext =
      new AudioContext();

    audioContextRef.current =
      audioContext;

    const analyser =
      audioContext.createAnalyser();

    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    analyserRef.current =
      analyser;

    const source =
      audioContext.createMediaStreamSource(
        audioStream
      );

    source.connect(analyser);

    monitorVoiceActivity();

  } catch (error) {
    console.error(
      "Microphone error:",
      error
    );

    await registerViolation(
      "MICROPHONE_DENIED",
      "Microphone permission was denied or the microphone could not be started."
    );
  }
};
  // ----------------------------------------
// MONITOR VOICE ACTIVITY
// ----------------------------------------

const monitorVoiceActivity = () => {
  if (!analyserRef.current) {
    return;
  }

  const analyser =
    analyserRef.current;

  const bufferLength =
    analyser.fftSize;

  const dataArray =
    new Uint8Array(bufferLength);

  const detectVoice = () => {
    if (
      !analyserRef.current ||
      result ||
      securityLocked
    ) {
      return;
    }

    analyser.getByteTimeDomainData(
      dataArray
    );

    let sum = 0;

    for (
      let i = 0;
      i < dataArray.length;
      i++
    ) {
      const normalized =
        (dataArray[i] - 128) / 128;

      sum +=
        normalized * normalized;
    }

    const rms =
      Math.sqrt(
        sum / dataArray.length
      );

    /*
      RMS measures the strength
      of the microphone signal.

      A value around 0.02 - 0.03
      is a reasonable starting point
      for detecting noticeable sound.
    */

    const VOICE_THRESHOLD = 0.035;

    const isSoundDetected =
      rms > VOICE_THRESHOLD;

    const now = Date.now();

    if (isSoundDetected) {
      if (
        !voiceStartedAtRef.current
      ) {
        voiceStartedAtRef.current =
          now;
      }

      const soundDuration =
        now -
        voiceStartedAtRef.current;

      /*
        Require approximately
        1 second of continuous sound
        before considering it a
        possible voice event.
      */

      if (
        soundDuration >= 1000 &&
        now -
          lastVoiceViolationRef.current >=
          8000
      ) {
        lastVoiceViolationRef.current =
          now;

        voiceStartedAtRef.current =
          null;

        registerViolation(
          "VOICE_DETECTED",
          "Voice or talking was detected. Please stay silent during the examination."
        );
      }
    } else {
      voiceStartedAtRef.current =
        null;
    }

    audioAnimationRef.current =
      requestAnimationFrame(
        detectVoice
      );
  };

  audioAnimationRef.current =
    requestAnimationFrame(
      detectVoice
    );
};
  // ----------------------------------------
  // FACE LANDMARKER
  // ----------------------------------------

  const initializeFaceDetection =
    async () => {
      try {
        const vision =
          await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
          );

        const landmarker =
          await FaceLandmarker.createFromOptions(
            vision,
            {
              baseOptions: {
                modelAssetPath:
                  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              },

              runningMode: "VIDEO",

              numFaces: 3,

              outputFaceBlendshapes: false,

              minFaceDetectionConfidence: 0.5,

              minFacePresenceConfidence: 0.5,

              minTrackingConfidence: 0.5,
            }
          );

        faceLandmarkerRef.current =
          landmarker;

        startFaceMonitoring();
      } catch (error) {
        console.error(
          "Face detection initialization error:",
          error
        );

        setFaceStatus(
          "Face detection unavailable"
        );
      }
    };

  // ----------------------------------------
  // FACE MONITORING
  // ----------------------------------------

  const startFaceMonitoring = () => {
    const detectFaces = () => {
      if (
        !videoRef.current ||
        !faceLandmarkerRef.current ||
        videoRef.current.readyState < 2
      ) {
        faceAnimationRef.current =
          requestAnimationFrame(
            detectFaces
          );

        return;
      }

      try {
        const result =
          faceLandmarkerRef.current.detectForVideo(
            videoRef.current,
            performance.now()
          );

        const detections =
          result.faceLandmarks || [];

        const count =
          detections.length;

        setFaceCount(count);

        if (count === 0) {
          setFaceStatus(
            "No face detected"
          );
        } else if (count === 1) {
          setFaceStatus(
            "Face detected"
          );
        } else {
          setFaceStatus(
            `${count} faces detected`
          );
        }

        // Multiple faces
        if (count > 1) {
          registerViolation(
            "MULTIPLE_FACES",
            "More than one person was detected by the examination camera."
          );
        }

        // No face
        if (count === 0) {
          registerViolation(
            "FACE_NOT_DETECTED",
            "Your face could not be detected. Please remain visible to the camera."
          );
        }

        // Basic head-turn detection
        if (count === 1) {
          detectHeadTurn(
            detections[0]
          );
        }
      } catch (error) {
        console.error(
          "Face detection error:",
          error
        );
      }

      faceAnimationRef.current =
        requestAnimationFrame(
          detectFaces
        );
    };

    faceAnimationRef.current =
      requestAnimationFrame(
        detectFaces
      );
  };

  // ----------------------------------------
  // BASIC HEAD TURN
  // ----------------------------------------

  const detectHeadTurn = (
    landmarks
  ) => {
    if (
      !landmarks ||
      landmarks.length < 20
    ) {
      return;
    }

    const nose = landmarks[1];

    const leftEye =
      landmarks[33];

    const rightEye =
      landmarks[263];

    if (
      !nose ||
      !leftEye ||
      !rightEye
    ) {
      return;
    }

    const eyeCenterX =
      (leftEye.x +
        rightEye.x) /
      2;

    const eyeWidth =
      Math.abs(
        rightEye.x -
          leftEye.x
      );

    if (eyeWidth === 0) {
      return;
    }

    const normalizedOffset =
      Math.abs(
        nose.x -
          eyeCenterX
      ) / eyeWidth;

    if (
      normalizedOffset > 0.75
    ) {
      registerViolation(
        "HEAD_TURN",
        "Your face appears to be turned away from the screen."
      );
    }
  };

  // ----------------------------------------
  // STOP CAMERA
  // ----------------------------------------

  // ----------------------------------------
// STOP CAMERA + MICROPHONE
// ----------------------------------------

const stopCamera = () => {
  // Stop camera
  if (streamRef.current) {
    streamRef.current
      .getTracks()
      .forEach((track) => track.stop());

    streamRef.current = null;
  }

  // Stop face monitoring
  if (faceAnimationRef.current) {
    cancelAnimationFrame(
      faceAnimationRef.current
    );

    faceAnimationRef.current = null;
  }

  // Close MediaPipe face landmarker
  if (
    faceLandmarkerRef.current &&
    typeof faceLandmarkerRef.current.close === "function"
  ) {
    try {
      faceLandmarkerRef.current.close();
    } catch (error) {
      console.warn(
        "Failed to close face landmarker:",
        error
      );
    }
  }

  faceLandmarkerRef.current = null;

  // Stop microphone monitoring
  if (audioAnimationRef.current) {
    cancelAnimationFrame(
      audioAnimationRef.current
    );

    audioAnimationRef.current = null;
  }

  // Stop microphone stream
  if (audioStreamRef.current) {
    audioStreamRef.current
      .getTracks()
      .forEach((track) => track.stop());

    audioStreamRef.current = null;
  }

  // Close audio context
  if (audioContextRef.current) {
    audioContextRef.current
      .close()
      .catch(() => {});

    audioContextRef.current = null;
  }

  analyserRef.current = null;
  voiceStartedAtRef.current = null;

  // Detach video stream
  if (videoRef.current) {
    videoRef.current.srcObject = null;
  }
};
  const cleanupExamEnvironment = async () => {
  // Stop camera, microphone and monitoring
  stopCamera();

  // Exit fullscreen
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch (error) {
      console.warn(
        "Failed to exit fullscreen:",
        error
      );
    }
  }

  setIsFullscreen(false);
};
  // ----------------------------------------
  // REGISTER VIOLATION
  // ----------------------------------------

  const registerViolation = async (
    type,
    message
  ) => {
    if (
      securityLocked ||
      result ||
      !attemptId
    ) {
      return;
    }

    const now = Date.now();

    const lastEvent =
      window.__lastProctoringEvent ||
      {};

    if (
      lastEvent[type] &&
      now - lastEvent[type] < 5000
    ) {
      return;
    }

    window.__lastProctoringEvent = {
      ...lastEvent,
      [type]: now,
    };

    try {
      const response =
        await api.post(
          `/attempts/${attemptId}/proctoring-event`,
          {
            type,
            message,
          }
        );

      const count =
        response.data.violationCount ||
        0;

      setViolationCount(count);

     if (response.data.autoSubmitted) {
  setSecurityLocked(true);

  // The backend has already changed the attempt
  // to AUTO_SUBMITTED, so DO NOT call /submit again.

  await cleanupExamEnvironment();

  setResult({
    status: "AUTO_SUBMITTED",
    score: response.data.score ?? 0,
    submittedAt:
      response.data.submittedAt ||
      new Date().toISOString(),
  });

  setViolationModal({
    title:
      "Exam Automatically Submitted",
    message:
      "The maximum number of security violations was reached. Your examination has been automatically submitted.",
    type: "auto-submit",
  });

  return;
}

      setViolationModal({
        title: "Security Warning",
        message:
          `${message}\n\nSecurity violations: ${count} / ${MAX_VIOLATIONS}`,
        type: "warning",
      });
    } catch (error) {
      console.error(
        "Proctoring event error:",
        error
      );
    }
  };

  // ----------------------------------------
  // FORCE SUBMIT
  // ----------------------------------------

  const forceSubmitExam = async () => {
    if (
      submitting ||
      result ||
      !attemptId
    ) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post(
  `/attempts/${attemptId}/submit`
);

      setResult(
        response.data.result
      );

      stopCamera();

      if (
        document.fullscreenElement
      ) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error(
        "Force submit error:",
        error
      );
    } finally {
      setSubmitting(false);
      setAutoSubmitting(false);
    }
  };

  // ----------------------------------------
  // FULLSCREEN CHANGE
  // ----------------------------------------

  useEffect(() => {
    const handleFullscreenChange =
      () => {
        const active =
          document.fullscreenElement !==
          null;

        setIsFullscreen(active);

        if (
          !active &&
          !showFullscreenScreen &&
          !result &&
          !securityLocked
        ) {
          registerViolation(
            "FULLSCREEN_EXIT",
            "You exited fullscreen mode. Please return to fullscreen mode to continue the examination."
          );
        }
      };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, [
    showFullscreenScreen,
    result,
    securityLocked,
  ]);

  // ----------------------------------------
  // TAB SWITCHING
  // ----------------------------------------

  useEffect(() => {
    const handleVisibility =
      () => {
        if (
          document.hidden &&
          !result &&
          !showFullscreenScreen &&
          !securityLocked
        ) {
          registerViolation(
            "TAB_SWITCH",
            "You left the examination window or switched to another tab."
          );
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [
    result,
    showFullscreenScreen,
    securityLocked,
  ]);

  // ----------------------------------------
  // COPY / PASTE / CUT / RIGHT CLICK
  // ----------------------------------------

  useEffect(() => {
    if (
      showFullscreenScreen ||
      result
    ) {
      return;
    }

    const preventCopy = (
      event
    ) => {
      event.preventDefault();

      registerViolation(
        "COPY",
        "Copying content is not allowed during the examination."
      );
    };

    const preventPaste = (
      event
    ) => {
      event.preventDefault();

      registerViolation(
        "PASTE",
        "Pasting content is not allowed during the examination."
      );
    };

    const preventCut = (
      event
    ) => {
      event.preventDefault();

      registerViolation(
        "CUT",
        "Cutting content is not allowed during the examination."
      );
    };

    const preventContextMenu =
      (event) => {
        event.preventDefault();

        registerViolation(
          "RIGHT_CLICK",
          "Right-click is disabled during the examination."
        );
      };

    document.addEventListener(
      "copy",
      preventCopy
    );

    document.addEventListener(
      "paste",
      preventPaste
    );

    document.addEventListener(
      "cut",
      preventCut
    );

    document.addEventListener(
      "contextmenu",
      preventContextMenu
    );

    return () => {
      document.removeEventListener(
        "copy",
        preventCopy
      );

      document.removeEventListener(
        "paste",
        preventPaste
      );

      document.removeEventListener(
        "cut",
        preventCut
      );

      document.removeEventListener(
        "contextmenu",
        preventContextMenu
      );
    };
  }, [
    showFullscreenScreen,
    result,
  ]);

  // ----------------------------------------
  // KEYBOARD RESTRICTIONS
  // ----------------------------------------

  useEffect(() => {
    const handleKeyboard =
      (event) => {
        if (
          showFullscreenScreen ||
          result
        ) {
          return;
        }

        const key =
          event.key.toLowerCase();

        const blocked =
          event.ctrlKey &&
          [
            "c",
            "v",
            "x",
            "a",
            "u",
            "s",
            "p",
          ].includes(key);

        const functionKey =
          [
            "f1",
            "f2",
            "f3",
            "f4",
            "f5",
            "f6",
            "f7",
            "f8",
            "f9",
            "f10",
            "f11",
            "f12",
          ].includes(
            event.key.toLowerCase()
          );

        const devTools =
          event.ctrlKey &&
          event.shiftKey &&
          [
            "i",
            "j",
            "c",
          ].includes(key);

        if (
          blocked ||
          functionKey ||
          devTools
        ) {
          event.preventDefault();

          registerViolation(
            "KEYBOARD_RESTRICTION",
            "This keyboard shortcut is not allowed during the examination."
          );
        }
      };

    document.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, [
    showFullscreenScreen,
    result,
  ]);

  // ----------------------------------------
  // LOAD SAVED ANSWERS
  // ----------------------------------------

 useEffect(() => {
  if (!attemptId) {
    return;
  }

  const loadSavedAnswers = async () => {
    try {
      const response = await api.get(
        `/attempts/${attemptId}`
      );

      const attemptData =
        response.data.attempt || response.data;

      const savedAnswers =
        attemptData.answers || [];

      const restoredAnswers = {};

      savedAnswers.forEach((answer) => {
        const questionId =
          typeof answer.question === "object"
            ? answer.question._id
            : answer.question;

        if (
          questionId &&
          answer.selectedAnswer !== null &&
          answer.selectedAnswer !== undefined
        ) {
          restoredAnswers[questionId] =
            answer.selectedAnswer;
        }
      });

      setAnswers(restoredAnswers);

      setViolationCount(
        attemptData.violationCount || 0
      );

      if (
        response.data.questions &&
        response.data.questions.length > 0
      ) {
        setQuestions(
          response.data.questions
        );
      }
    } catch (error) {
      console.error(
        "Load saved answers error:",
        error
      );
    }
  };

  loadSavedAnswers();
}, [attemptId]);

  // ----------------------------------------
  // TIMER
  // ----------------------------------------

  useEffect(() => {
  if (!examDeadline || result) {
    return;
  }

  const updateTimer = () => {
    const remaining =
      examDeadline - Date.now();

    if (remaining <= 0) {
      setTimeRemaining(0);
      return;
    }

    setTimeRemaining(remaining);
  };

  updateTimer();

  const timer = setInterval(
    updateTimer,
    1000
  );

  return () => {
    clearInterval(timer);
  };
}, [examDeadline, result]);

  // ----------------------------------------
  // AUTO SUBMIT TIMER
  // ----------------------------------------

  useEffect(() => {
    if (
      timeRemaining === 0 &&
      examDeadline &&
      !autoSubmitting &&
      !result &&
      !submitting
    ) {
      setAutoSubmitting(
        true
      );

      forceSubmitExam();
    }
  }, [
    timeRemaining,
    examDeadline,
    autoSubmitting,
    result,
    submitting,
  ]);

  // ----------------------------------------
  // MANUAL SUBMIT
  // ----------------------------------------

  const handleSubmitExam =
    async (
      isAutomatic = false
    ) => {
      if (!isAutomatic) {
        const confirmed =
          window.confirm(
            "Are you sure you want to submit the exam?"
          );

        if (!confirmed) {
          return;
        }
      }

      try {
        setSubmitting(true);
        setSubmitError("");

        const response = await api.post(
  `/attempts/${attemptId}/submit`
);

        setResult(
          response.data.result
        );
       await cleanupExamEnvironment();
      } catch (error) {
        console.error(
          "Submit exam error:",
          error
        );

        setSubmitError(
          error.response?.data
            ?.message ||
            "Failed to submit exam"
        );

        if (isAutomatic) {
          setAutoSubmitting(
            false
          );
        }
      } finally {
        setSubmitting(false);
      }
    };

  // ----------------------------------------
  // ANSWER CHANGE
  // ----------------------------------------

 const handleAnswerChange = async (answerIndex) => {
  const question = questions[currentQuestion];

  if (!question) {
    return;
  }

  const questionId = question._id;

  setAnswers((previous) => ({
    ...previous,
    [questionId]: answerIndex,
  }));

  try {
    await api.patch(
      `/attempts/${attemptId}/answers`,
      {
        questionId,
        selectedAnswer: answerIndex,
      }
    );
  } catch (error) {
    console.error(
      "Save answer error:",
      error
    );

    setSubmitError(
      error.response?.data?.message ||
        "Failed to save answer"
    );
  }
};

  // ----------------------------------------
  // NO EXAM DATA
  // ----------------------------------------

  if (!examData) {
    return (
      <div className="exam-error-page">
        <div className="exam-error-card">
          <div className="error-icon">
            !
          </div>

          <h1>
            Exam Data Not Found
          </h1>

          <button
            className="primary-button"
            onClick={() =>
              navigate(
                "/student/dashboard"
              )
            }
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  if (!exam) {
  return (
    <div className="exam-error-page">
      <div className="exam-error-card">
        <h1>Loading Exam...</h1>

        <p>
          Preparing your examination environment.
        </p>
      </div>
    </div>
  );
}

  // ----------------------------------------
  // RESULT
  // ----------------------------------------

  if (result) {
    return (
      <div className="exam-result-page">
        <div className="result-card">
          <div className="success-icon">
            ✓
          </div>

          <h1>
            Exam Submitted
          </h1>

          <p className="result-message">
            Your examination has been
            successfully submitted.
          </p>

          <div className="result-info">
            <div className="result-info-row">
              <span>Exam</span>

              <strong>
                {exam.title}
              </strong>
            </div>

            <div className="result-info-row">
              <span>
                Submission Type
              </span>

              <strong>
                {result.status ===
                "AUTO_SUBMITTED"
                  ? "Automatically Submitted"
                  : "Submitted by Student"}
              </strong>
            </div>

            <div className="result-info-row">
              <span>
                Submitted At
              </span>

              <strong>
                {new Date(
                  result.submittedAt
                ).toLocaleString()}
              </strong>
            </div>
          </div>

          <button
            className="primary-button result-button"
            onClick={() =>
              navigate(
                "/student/dashboard"
              )
            }
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // FULLSCREEN START
  // ----------------------------------------

  if (showFullscreenScreen) {
    return (
      <div className="secure-start-page">
        <div className="secure-start-card">
          <div className="secure-logo">
            EXAM
          </div>

          <h1>
            Ready to Begin?
          </h1>

          <p className="secure-subtitle">
            You are entering a secure
            examination environment.
          </p>

          <div className="exam-preview">
            <div className="preview-item">
              <span className="preview-icon">
                EX
              </span>

              <div>
                <small>
                  Exam
                </small>

                <strong>
                  {exam.title}
                </strong>
              </div>
            </div>

            <div className="preview-item">
              <span className="preview-icon">
                TM
              </span>

              <div>
                <small>
                  Duration
                </small>

                <strong>
                  {exam.duration} minutes
                </strong>
              </div>
            </div>

            <div className="preview-item">
              <span className="preview-icon">
                Q
              </span>

              <div>
                <small>
                  Questions
                </small>

                <strong>
                  {questions.length}
                </strong>
              </div>
            </div>

            <div className="preview-item">
              <span className="preview-icon">
                CAM
              </span>

              <div>
                <small>
                  Camera
                </small>

                <strong>
                  Required
                </strong>
              </div>
            </div>
          </div>

          <div className="fullscreen-notice">
            <div className="notice-icon">
              !
            </div>

            <div>
              <strong>
                Secure Exam Rules
              </strong>

              <p>
                Fullscreen mode and camera
                access are required. Leaving
                the exam, switching tabs,
                copying content, or other
                restricted actions generate
                security warnings.
              </p>
            </div>
          </div>

          <button
            className="start-exam-button"
            onClick={
              enterFullscreen
            }
          >
            Enter Fullscreen & Start Exam
          </button>

          <button
            className="cancel-exam-button"
            onClick={() =>
              navigate(
                "/student/dashboard"
              )
            }
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // EXAM CALCULATIONS
  // ----------------------------------------

  const totalSeconds =
    Math.floor(
      (timeRemaining || 0) /
        1000
    );

  const minutes =
    Math.floor(
      totalSeconds / 60
    );

  const seconds =
    totalSeconds % 60;

  const question =
    questions[
      currentQuestion
    ];

 const answeredCount = Object.values(
  answers
).filter(
  (answer) =>
    answer !== null &&
    answer !== undefined
).length;
  const progress =
    questions.length > 0
      ? ((currentQuestion + 1) /
          questions.length) *
        100
      : 0;

  const isTimeLow =
    totalSeconds <= 300;

  // ----------------------------------------
  // EXAM UI
  // ----------------------------------------

  return (
    <div className="exam-page">

      {/* STUDENT WATERMARK */}

      <div
        className="exam-watermark"
        aria-hidden="true"
      >
        {Array.from({
          length: 16,
        }).map((_, index) => (
          <span key={index}>
            {watermarkText}
          </span>
        ))}
      </div>

      {/* CAMERA */}

      <div className="camera-monitor">
        <video
          ref={videoRef}
          muted
          playsInline
          className="camera-video"
        />

        <div className="camera-status">
          <span
            className={`camera-dot ${
              cameraStatus ===
              "active"
                ? "active"
                : "warning"
            }`}
          />

          {cameraStatus ===
          "active"
            ? "Camera Active"
            : "Camera Warning"}
        </div>

        <div className="face-status">
          {faceStatus}
        </div>
        <div className="voice-status">
  <span className="voice-dot" />
  Voice Monitoring Active
</div>
      </div>

      {/* SECURITY MODAL */}

      {violationModal && (
        <div className="security-modal-overlay">
          <div className="security-modal">
            <div className="security-modal-icon">
              !
            </div>

            <h2>
              {violationModal.title}
            </h2>

            <p>
              {violationModal.message}
            </p>

            {violationModal.type !==
              "auto-submit" && (
              <div className="violation-counter">
                Security Violations:{" "}
                <strong>
                  {violationCount}
                </strong>{" "}
                / {MAX_VIOLATIONS}
              </div>
            )}

            {violationModal.type ===
              "warning" && (
              <button
                className="modal-primary-button"
                onClick={() => {
                  setViolationModal(
                    null
                  );

                  if (
                    !document.fullscreenElement
                  ) {
                    document.documentElement
                      .requestFullscreen()
                      .catch(() => {});
                  }
                }}
              >
                Return to Exam
              </button>
            )}

            {violationModal.type ===
              "fullscreen" && (
              <button
                className="modal-primary-button"
                onClick={() => {
                  document.documentElement
                    .requestFullscreen()
                    .then(() => {
                      setViolationModal(
                        null
                      );
                    })
                    .catch(() => {});
                }}
              >
                Enter Fullscreen
              </button>
            )}

            {violationModal.type ===
              "auto-submit" && (
              <button
                className="modal-danger-button"
                onClick={() =>
                  navigate(
                    "/student/dashboard"
                  )
                }
              >
                Continue
              </button>
            )}
          </div>
        </div>
      )}

      {/* HEADER */}

      <header className="exam-header">
        <div className="exam-brand">
          <div className="brand-icon">
            E
          </div>

          <div>
            <h2>
              Exam Portal
            </h2>

            <span>
              Secure Examination
            </span>
          </div>
        </div>

        <div className="exam-title-header">
          <span>
            EXAMINATION
          </span>

          <strong>
            {exam.title}
          </strong>
        </div>

        <div className="header-right">
          <div
            className={`fullscreen-status ${
              isFullscreen
                ? "active"
                : "inactive"
            }`}
          >
            <span className="status-dot" />

            {isFullscreen
              ? "Fullscreen"
              : "Windowed"}
          </div>

          <div className="violation-badge">
            Violations{" "}
            {violationCount}/
            {MAX_VIOLATIONS}
          </div>

          <div
            className={`timer-box ${
              isTimeLow
                ? "timer-warning"
                : ""
            }`}
          >
            <span className="timer-label">
              TIME LEFT
            </span>

            <strong>
              {minutes
                .toString()
                .padStart(2, "0")}
              :
              {seconds
                .toString()
                .padStart(2, "0")}
            </strong>
          </div>
        </div>
      </header>

      {/* PROGRESS */}

      <div className="exam-progress-wrapper">
        <div className="exam-progress">
          <div
            className="exam-progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <span>
          Question{" "}
          {currentQuestion + 1}{" "}
          of{" "}
          {questions.length}
        </span>
      </div>

      {/* CONTENT */}

      <main className="exam-content">
        <section className="question-section">
          <div className="question-card">
            <div className="question-top">
              <span className="question-number">
                {" "}
                {String(
                  currentQuestion + 1
                ).padStart(2, "0")}
              </span>

              <span className="question-marks">
                {question.marks ||
                  1}{" "}
                Mark
                {question.marks >
                1
                  ? "s"
                  : ""}
              </span>
            </div>

            <h1 className="question-text">
              {question.questionText}
            </h1>

            <p className="question-help">
              Select one answer from
              the options below.
            </p>

            <div className="options-list">
              {question.options.map(
                (
                  option,
                  index
                ) => {
                  const selected =
                    answers[
                      question._id
                    ] === index;

                  return (
                    <label
                      key={index}
                      className={`option-card ${
                        selected
                          ? "selected"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name={
                          question._id
                        }
                        checked={
                          selected
                        }
                        onChange={() =>
                          handleAnswerChange(
                            index
                          )
                        }
                      />

                      <span className="option-letter">
                        {String.fromCharCode(
                          65 +
                            index
                        )}
                      </span>

                      <span className="option-text">
                        {option}
                      </span>

                      {selected && (
                        <span className="selected-check">
                          ✓
                        </span>
                      )}
                    </label>
                  );
                }
              )}
            </div>
          </div>

          <div className="question-navigation">
            <button
              className="secondary-button"
              disabled={
                currentQuestion ===
                0
              }
              onClick={() =>
                setCurrentQuestion(
                  currentQuestion -
                    1
                )
              }
            >
              Previous
            </button>

            <span className="answer-status">
              {answers[question._id] !== undefined &&
answers[question._id] !== null
  ? "Answer saved"
  : "Not answered"}
            </span>

            <button
              className="primary-button"
              disabled={
                currentQuestion ===
                questions.length -
                  1
              }
              onClick={() =>
                setCurrentQuestion(
                  currentQuestion +
                    1
                )
              }
            >
              Next
            </button>
          </div>
        </section>

        {/* SIDEBAR */}

        <aside className="exam-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-heading">
              <span className="heading-icon">
                P
              </span>

              <h3>
                Exam Progress
              </h3>
            </div>

            <div className="progress-stat">
              <div className="progress-circle">
                <span>
                  {answeredCount}
                </span>

                <small>
                  /{" "}
                  {
                    questions.length
                  }
                </small>
              </div>

              <div>
                <strong>
                  Questions Answered
                </strong>

                <p>
                  {questions.length -
                    answeredCount}{" "}
                  remaining
                </p>
              </div>
            </div>

            <div className="mini-progress">
              <div
                style={{
                  width: `${
                    questions.length >
                    0
                      ? (answeredCount /
                          questions.length) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="sidebar-card">
            <div className="sidebar-heading">
              <span className="heading-icon">
                Q
              </span>

              <h3>
                Questions
              </h3>
            </div>

            <div className="question-grid">
              {questions.map(
                (
                  item,
                  index
                ) => {
                  const answered =
                    answers[
                      item._id
                    ] !== undefined;

                  const current =
                    currentQuestion ===
                    index;

                  return (
                    <button
                      key={
                        item._id
                      }
                      className={`question-number-button ${
                        current
                          ? "current"
                          : ""
                      } ${
                        answered
                          ? "answered"
                          : ""
                      }`}
                      onClick={() =>
                        setCurrentQuestion(
                          index
                        )
                      }
                    >
                      {index + 1}
                    </button>
                  );
                }
              )}
            </div>

            <div className="legend">
              <span>
                <i className="legend-current" />
                Current
              </span>

              <span>
                <i className="legend-answered" />
                Answered
              </span>

              <span>
                <i className="legend-unanswered" />
                Unanswered
              </span>
            </div>
          </div>

          <div className="security-card">
            <div className="security-icon">
              S
            </div>

            <div>
              <strong>
                Secure Exam
              </strong>

              <p>
                Camera and browser
                activity are being
                monitored.
              </p>
            </div>
          </div>

          <button
            className="submit-exam-button"
            onClick={() =>
              handleSubmitExam(
                false
              )
            }
            disabled={
              submitting ||
              autoSubmitting
            }
          >
            {submitting ||
            autoSubmitting
              ? "Submitting..."
              : "Submit Exam"}
          </button>

          {submitError && (
            <div className="submit-error">
              {submitError}
            </div>
          )}
        </aside>
      </main>

      <footer className="exam-footer">
        <span>
          Exam Portal
        </span>

        <span>
          Secure Examination
          Environment
        </span>

        <span>
          Attempt ID:{" "}
          {attemptId}
        </span>
      </footer>
    </div>
  );
}

export default TakeExam;
// js/addNoteRecorder.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("Setting up note recorder listener...");

    const recordButton = document.getElementById('record-note-button');
    const noteTextArea = document.getElementById('note-text-area');
    const addNotesModalElement = document.getElementById('addNotesModal'); // Reference to modal

    if (!recordButton || !noteTextArea || !addNotesModalElement) {
        console.error('Required elements for note recorder (button, text area, or modal) not found.');
        return;
    }

    // --- Check for Web Speech API support ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn('Web Speech API not supported by this browser.');
        recordButton.disabled = true;
        recordButton.innerHTML = '<i class="fa fa-microphone-slash"></i> Not Supported';
        return;
    }

    let recognition = null; // To hold the recognition instance
    let isRecording = false;

    // --- Setup Recognition Instance ---
    function initializeRecognition() {
        if (!recognition) {
             recognition = new SpeechRecognition();
             recognition.continuous = true; // Keep listening even after pauses
             recognition.interimResults = true; // Get results as they come in
             recognition.lang = 'en-US'; // Set language

            recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // Append final transcript with a space if textarea has content
                if (finalTranscript) {
                     const currentText = noteTextArea.value;
                     noteTextArea.value = currentText + (currentText.length > 0 && !currentText.endsWith(' ') ? ' ' : '') + finalTranscript + ' ';
                }

                // Optional: Display interim results (can be distracting)
                // console.log("Interim: ", interimTranscript); 
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                toastr.error(`Speech recognition error: ${event.error}`);
                 stopRecording(); // Stop recording on error
            };

            recognition.onend = () => {
                console.log('Speech recognition ended.');
                 // Only reset button if we didn't *intend* to stop
                 if (isRecording) { 
                     console.log('Recognition ended unexpectedly, attempting to restart.');
                     // Optional: Automatically restart? Can lead to issues.
                     // startRecording(); 
                     // Or just reset the button state:
                     stopRecording(); 
                 }
            };
        }
    }
    
    // --- Control Functions ---
    function startRecording() {
        if (isRecording) return; // Already recording
        if (!recognition) initializeRecognition(); // Ensure it's initialized

        try {
            recognition.start();
            isRecording = true;
            recordButton.innerHTML = '<i class="fa fa-stop"></i> Stop Recording';
            recordButton.classList.remove('btn-info');
            recordButton.classList.add('btn-danger');
             console.log('Speech recognition started.');
        } catch (error) {
            console.error("Error starting recognition:", error);
            toastr.error("Could not start recording. Check microphone permissions?");
            isRecording = false; // Reset state
        }
    }

    function stopRecording() {
        if (!isRecording || !recognition) return; // Not recording or not initialized

        recognition.stop();
        isRecording = false;
        recordButton.innerHTML = '<i class="fa fa-microphone"></i> Record';
        recordButton.classList.remove('btn-danger');
        recordButton.classList.add('btn-info');
        console.log('Speech recognition stopped.');
    }

    // --- Button Click Handler ---
    recordButton.addEventListener('click', () => {
        if (isRecording) {
            stopRecording();
        } else {
            // Ensure textarea is focused or visible if needed?
            startRecording();
        }
    });

     // --- Stop Recording when Modal is Hidden ---
     addNotesModalElement.addEventListener('hidden.bs.modal', () => {
          console.log('Add Notes modal hidden, ensuring recording is stopped.');
          if (isRecording) {
             stopRecording();
          }
          // Optional: destroy recognition instance to free resources?
          // if (recognition) {
          //    recognition.abort(); // Force stop any pending activity
          //    recognition = null; 
          // }
     });
});
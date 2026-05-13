export function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  
  // Cancel any ongoing speech to prioritize the immediate feedback
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.1; // Slightly faster for workout energy
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  // Try to find an English voice, preferably male/energetic sounding but default is fine
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(v => v.lang.startsWith('en-') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en-'));
  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  window.speechSynthesis.speak(utterance);
}

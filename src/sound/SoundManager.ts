import type p5 from 'p5';

export class SoundManager {
    private p: p5;
    private sounds: Map<string, any> = new Map();
    private enabled: boolean = true;

    constructor(p: p5) {
        this.p = p;
    }

    /**
     * Load a sound file
     * @param name - Name identifier for the sound
     * @param path - Path to the sound file
     */
    loadSound(name: string, path: string): void {
        if ((this.p as any).loadSound) {
            const sound = (this.p as any).loadSound(path);
            this.sounds.set(name, sound);
        }
    }

    /**
     * Play a sound by name
     * @param name - Name of the sound to play
     * @param volume - Volume level (0.0 to 1.0), default 0.5
     */
    play(name: string, volume: number = 0.5): void {
        if (!this.enabled) return;

        const sound = this.sounds.get(name);
        if (sound) {
            sound.setVolume(volume);
            sound.play();
        }
    }

    /**
     * Play a synthesized pop sound (no file needed)
     */
    playPopSound(): void {
        if (!this.enabled) return;

        // Create a synthesized pop sound using p5.sound oscillator
        if ((this.p as any).getAudioContext) {
            const audioContext = (this.p as any).getAudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Pop sound characteristics
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        }
    }

    /**
     * Play a synthesized success sound (no file needed)
     */
    playSuccessSound(): void {
        if (!this.enabled) return;

        if ((this.p as any).getAudioContext) {
            const audioContext = (this.p as any).getAudioContext();

            // Create a pleasant ascending tone
            const playTone = (frequency: number, startTime: number, duration: number) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(frequency, startTime);
                gainNode.gain.setValueAtTime(0.2, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            };

            const now = audioContext.currentTime;
            playTone(523, now, 0.15);        // C
            playTone(659, now + 0.1, 0.15);  // E
            playTone(784, now + 0.2, 0.3);   // G
        }
    }

    /**
     * Toggle sound on/off
     */
    toggle(): void {
        this.enabled = !this.enabled;
    }

    /**
     * Enable or disable sounds
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    isEnabled(): boolean {
        return this.enabled;
    }
}

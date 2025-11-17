import type p5 from 'p5';

export class SoundManager {
    private p: p5;
    private sounds: Map<string, any> = new Map();
    private enabled: boolean = true;
    private audioContext: AudioContext | null = null;
    private audioContextInitialized: boolean = false;

    constructor(p: p5) {
        this.p = p;
        this.createAudioContext();
    }

    /**
     * Create and initialize audio context
     */
    private createAudioContext(): void {
        try {
            // Try to get p5.sound audio context first
            if ((this.p as any).getAudioContext) {
                this.audioContext = (this.p as any).getAudioContext();
                console.log('Using p5.sound AudioContext');
            } else {
                // Fallback to creating our own AudioContext
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                console.log('Created new AudioContext');
            }

            // Setup user interaction to resume audio context
            const initAudio = () => {
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    this.audioContext.resume().then(() => {
                        this.audioContextInitialized = true;
                        console.log('Audio context resumed');
                    }).catch(err => console.warn('Failed to resume audio context:', err));
                } else {
                    this.audioContextInitialized = true;
                }
            };

            // Try to initialize on various user interactions
            document.addEventListener('click', initAudio, { once: true });
            document.addEventListener('touchstart', initAudio, { once: true });
            document.addEventListener('keydown', initAudio, { once: true });
            document.addEventListener('mousedown', initAudio, { once: true });
        } catch (error) {
            console.error('Failed to create AudioContext:', error);
        }
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
        if (!this.enabled || !this.audioContext) return;

        try {
            // Ensure audio context is running
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Pop sound characteristics
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (error) {
            console.warn('Failed to play pop sound:', error);
        }
    }

    /**
     * Play a synthesized success sound (no file needed)
     */
    playSuccessSound(): void {
        if (!this.enabled || !this.audioContext) return;

        try {
            // Ensure audio context is running
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            // Create a pleasant ascending tone
            const playTone = (frequency: number, startTime: number, duration: number) => {
                if (!this.audioContext) return;

                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.setValueAtTime(frequency, startTime);
                gainNode.gain.setValueAtTime(0.2, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            };

            const now = this.audioContext.currentTime;
            playTone(523, now, 0.15);        // C
            playTone(659, now + 0.1, 0.15);  // E
            playTone(784, now + 0.2, 0.3);   // G
        } catch (error) {
            console.warn('Failed to play success sound:', error);
        }
    }

    /**
     * Play a synthesized losing sound (no file needed)
     */
    playLoseSound(): void {
        if (!this.enabled || !this.audioContext) return;

        try {
            // Ensure audio context is running
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            // Create a descending "sad trombone" style tone
            const playTone = (frequency: number, startTime: number, duration: number) => {
                if (!this.audioContext) return;

                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.setValueAtTime(frequency, startTime);
                gainNode.gain.setValueAtTime(0.25, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            };

            const now = this.audioContext.currentTime;
            playTone(392, now, 0.2);        // G (lower)
            playTone(349, now + 0.15, 0.2); // F
            playTone(294, now + 0.3, 0.2);  // D
            playTone(262, now + 0.45, 0.4); // C (low and long)
        } catch (error) {
            console.warn('Failed to play lose sound:', error);
        }
    }

    /**
     * Play a penalty sound when player loses a life (but not game over)
     */
    playPenaltySound(): void {
        if (!this.enabled || !this.audioContext) return;

        try {
            // Ensure audio context is running
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Sharp, quick warning sound
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.15);

            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.15);
        } catch (error) {
            console.warn('Failed to play penalty sound:', error);
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

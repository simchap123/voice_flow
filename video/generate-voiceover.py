"""Generate voiceover audio for VoiceFlow promo video using edge-tts."""
import asyncio
import edge_tts

VOICE = "en-US-AndrewNeural"

# Plain text - edge-tts handles pacing from punctuation naturally.
# Periods and commas create natural pauses. Newlines are ignored.
SCRIPT = (
    "VoiceFlow. "
    "Type with your voice. "
    "... "
    "Typing is slow. "
    "But speaking? It's three times faster. "
    "... "
    "Just press Alt, and start talking. "
    "VoiceFlow transcribes your words, removes filler, fixes grammar, "
    "and types the clean text right where your cursor is. "
    "... "
    "Works in any app. "
    "AI powered text cleanup. "
    "Lightning fast transcription. "
    "And completely private. "
    "... "
    "Simple pricing. Start free with your own API key. "
    "... "
    "Download VoiceFlow free today. "
    "free voice flow dot vercel dot app."
)

OUTPUT = "public/voiceover.mp3"


async def main():
    communicate = edge_tts.Communicate(SCRIPT, VOICE)
    await communicate.save(OUTPUT)
    print(f"Voiceover saved to {OUTPUT}")


asyncio.run(main())

const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const tts       = require('@google-cloud/text-to-speech');

admin.initializeApp();
const client = new tts.TextToSpeechClient();
const bucket = admin.storage().bucket('clareiamente-audios');

exports.generateTherapyAudio = functions.region('southamerica-east1')
  .firestore.document('responses/{docId}')
  .onCreate(async (snap, ctx) => {
    const d = snap.data();
    const roteiro = `Olá! Você selecionou foco em ${d.focusArea}. Quando você pensa: "${d.keyThoughts}" sente: ${d.bodySensation}. Imagine-se ${d.visualization}. Agora escute e relaxe...`;
    const [res] = await client.synthesizeSpeech({
      input: { text: roteiro },
      voice: {
        languageCode: 'pt-BR',
        ssmlGender: d.voicePreference.includes('Masculina') ? 'MALE' : 'FEMALE'
      },
      audioConfig: { audioEncoding: 'MP3' }
    });
    const file = bucket.file(`${ctx.params.docId}.mp3`);
    await file.save(res.audioContent, { contentType: 'audio/mpeg' });
    const url = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    await snap.ref.update({ audioUrl: url });
  });

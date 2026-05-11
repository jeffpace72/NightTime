const Alexa = require('ask-sdk-core');
const {
  resolveSound,
  SOUND_LIST,
  BUCKET_URL,
  INTRO_MP3_URL,
  audioMetadataForSound,
  streamToken,
  soundFromStreamToken
} = require('./audioAssets');
const launchDocument = require('./launchDocument.json');
const playDocument = require('./playDocument.json');

function supportsAPL(handlerInput) {
  const interfaces = ((handlerInput.requestEnvelope.context.System || {}).device || {}).supportedInterfaces;
  return interfaces && interfaces['Alexa.Presentation.APL'];
}

// ─── Launch ───────────────────────────────────────────────────────────────────

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const soundNames = SOUND_LIST.map(s => s.title).join(', ');
    const welcome = `Welcome to Night Time. I can play: ${soundNames}. Which would you like to hear?`;
    const builder = handlerInput.responseBuilder
      .speak(`<speak><audio src="${INTRO_MP3_URL}"/>${welcome}</speak>`)
      .reprompt('Which sound would you like? Say a sound name, or say list sounds for your options.');

    if (supportsAPL(handlerInput)) {
      builder.addDirective({
        type: 'Alexa.Presentation.APL.RenderDocument',
        token: 'launchToken',
        document: launchDocument,
        datasources: {
          data: {
            title: 'Night Time',
            subtitle: 'Say a sound name to begin',
            backgroundUrl: `${BUCKET_URL}/images/app_launch.png`
          }
        }
      });
    }

    return builder.getResponse();
  }
};

// ─── Play Sound ───────────────────────────────────────────────────────────────

const PlaySoundIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlaySoundIntent';
  },
  handle(handlerInput) {
    const slotValue = Alexa.getSlotValue(handlerInput.requestEnvelope, 'sound');
    const sound = resolveSound(slotValue);

    if (!sound) {
      const soundNames = SOUND_LIST.map(s => s.title).join(', ');
      return handlerInput.responseBuilder
        .speak(`Sorry, I don't have ${slotValue || 'that sound'}. Available sounds are: ${soundNames}.`)
        .reprompt('Which sound would you like to play?')
        .getResponse();
    }

    const builder = handlerInput.responseBuilder
      .speak(`Playing ${sound.title}.`)
      .addAudioPlayerPlayDirective(
        'REPLACE_ALL', sound.url, streamToken(sound), 0, null, audioMetadataForSound(sound)
      )
      .withShouldEndSession(true);

    if (supportsAPL(handlerInput)) {
      builder.addDirective({
        type: 'Alexa.Presentation.APL.RenderDocument',
        token: 'playingToken',
        document: playDocument,
        datasources: {
          data: { backgroundUrl: sound.backgroundUrl }
        }
      });
    }

    return builder.getResponse();
  }
};

// ─── List Sounds ──────────────────────────────────────────────────────────────

const ListSoundsIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ListSoundsIntent';
  },
  handle(handlerInput) {
    const soundNames = SOUND_LIST.map(s => s.title).join(', ');
    return handlerInput.responseBuilder
      .speak(`Available sounds are: ${soundNames}. Which would you like to play?`)
      .reprompt('Which sound would you like?')
      .getResponse();
  }
};

// ─── Pause ────────────────────────────────────────────────────────────────────

const PauseIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.PauseIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .addAudioPlayerStopDirective()
      .addAudioPlayerClearQueueDirective('CLEAR_ALL')
      .withShouldEndSession(true)
      .getResponse();
  }
};

// ─── Resume ───────────────────────────────────────────────────────────────────

const ResumeIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.ResumeIntent';
  },
  handle(handlerInput) {
    const token = handlerInput.requestEnvelope.context.AudioPlayer
      ? handlerInput.requestEnvelope.context.AudioPlayer.token
      : null;

    if (!token) {
      return handlerInput.responseBuilder
        .speak('There is nothing to resume. Which sound would you like to play?')
        .reprompt('Which sound would you like?')
        .getResponse();
    }

    const sound = soundFromStreamToken(token);
    if (!sound) {
      return handlerInput.responseBuilder
        .speak('I could not resume. Which sound would you like to play?')
        .reprompt('Which sound would you like?')
        .getResponse();
    }

    const offsetInMilliseconds = handlerInput.requestEnvelope.context.AudioPlayer.offsetInMilliseconds || 0;
    const builder = handlerInput.responseBuilder
      .addAudioPlayerPlayDirective(
        'REPLACE_ALL', sound.url, streamToken(sound), offsetInMilliseconds, null, audioMetadataForSound(sound)
      )
      .withShouldEndSession(true);

    if (supportsAPL(handlerInput)) {
      builder.addDirective({
        type: 'Alexa.Presentation.APL.RenderDocument',
        token: 'playingToken',
        document: playDocument,
        datasources: {
          data: { backgroundUrl: sound.backgroundUrl }
        }
      });
    }

    return builder.getResponse();
  }
};

// ─── Stop / Cancel ────────────────────────────────────────────────────────────

const StopCancelIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Goodnight.')
      .addAudioPlayerStopDirective()
      .addAudioPlayerClearQueueDirective('CLEAR_ALL')
      .withShouldEndSession(true)
      .getResponse();
  }
};

// ─── Help ─────────────────────────────────────────────────────────────────────

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const soundNames = SOUND_LIST.map(s => s.title).join(', ');
    return handlerInput.responseBuilder
      .speak(`Night Time plays ambient sounds to help you relax or sleep. Available sounds are: ${soundNames}. Say play followed by a sound name. For example, say play rain.`)
      .reprompt('Which sound would you like to play?')
      .getResponse();
  }
};

// ─── AudioPlayer Events ───────────────────────────────────────────────────────

const AudioPlayerEventHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type.startsWith('AudioPlayer.');
  },
  handle(handlerInput) {
    const requestType = handlerInput.requestEnvelope.request.type;

    if (requestType === 'AudioPlayer.PlaybackNearlyFinished') {
      const token = handlerInput.requestEnvelope.request.token;
      const sound = soundFromStreamToken(token);

      if (sound) {
        // Re-enqueue the same track for seamless looping
        return handlerInput.responseBuilder
          .addAudioPlayerPlayDirective('ENQUEUE', sound.url, streamToken(sound), 0, token, audioMetadataForSound(sound))
          .getResponse();
      }
    }

    return handlerInput.responseBuilder.getResponse();
  }
};

// ─── PlaybackController (hardware buttons on Echo devices) ───────────────────

const PlaybackControllerHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type.startsWith('PlaybackController.');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  }
};

// ─── Error Handler ────────────────────────────────────────────────────────────

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error('Unhandled error:', JSON.stringify(error));
    return handlerInput.responseBuilder
      .speak('Sorry, something went wrong. Please try again.')
      .reprompt('Which sound would you like to play?')
      .getResponse();
  }
};

// ─── Skill Builder ────────────────────────────────────────────────────────────

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    PlaySoundIntentHandler,
    ListSoundsIntentHandler,
    PauseIntentHandler,
    ResumeIntentHandler,
    StopCancelIntentHandler,
    HelpIntentHandler,
    AudioPlayerEventHandler,
    PlaybackControllerHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();

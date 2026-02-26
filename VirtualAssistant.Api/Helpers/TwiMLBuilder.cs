using Twilio.TwiML;
using Twilio.TwiML.Voice;

namespace VirtualAssistant.Api.Helpers;

public static class TwiMLBuilder
{
    public static string MainMenu(string gatherUrl)
    {
        var response = new VoiceResponse();
        var gather = new Gather(numDigits: 1, action: new Uri(gatherUrl), method: Twilio.Http.HttpMethod.Post);
        gather.Say("Hello, you have reached the virtual assistant. " +
                   "Press 1 to schedule a new appointment. " +
                   "Press 2 to reschedule an existing appointment. " +
                   "Press 3 to cancel an appointment. " +
                   "Press 0 to leave a voicemail.", voice: "Polly.Joanna");
        response.Append(gather);
        response.Say("We did not receive your input. Goodbye.", voice: "Polly.Joanna");
        return response.ToString();
    }

    public static string RecordMessage(string message, string recordingActionUrl)
    {
        var response = new VoiceResponse();
        response.Say(message, voice: "Polly.Joanna");
        response.Record(
            action: new Uri(recordingActionUrl),
            method: Twilio.Http.HttpMethod.Post,
            maxLength: 120,
            transcribe: true,
            transcribeCallback: new Uri(recordingActionUrl.Replace("/recording", "/transcription")));
        return response.ToString();
    }

    public static string SayAndHangup(string message)
    {
        var response = new VoiceResponse();
        response.Say(message, voice: "Polly.Joanna");
        response.Hangup();
        return response.ToString();
    }

    public static string EmptyResponse()
    {
        return new VoiceResponse().ToString();
    }
}

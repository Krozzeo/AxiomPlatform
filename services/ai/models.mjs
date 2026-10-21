// Known compatible families distinguish listed models; unknown models remain selectable.
// Exclude documented specialized/legacy endpoints without probing generation.
const modelFamilies=['gpt-6-astra','gpt-6.1-sol','gpt-6-sol','gpt-6-luna','gpt-5.6-sol','gpt-5.6-terra','gpt-5.6-luna','gpt-5.5','gpt-5.4','gpt-5.4-mini','gpt-5.2','gpt-5','gpt-5-mini','gpt-5-nano','gpt-4.1','gpt-4.1-mini','gpt-4.1-nano','gpt-4o','gpt-4o-mini','o3','o3-mini','o4-mini'];
export const isVerifiedAssistantModel=id=>typeof id==='string'&&modelFamilies.some(f=>id===f||(id.startsWith(f+'-')&&/^\d{4}-\d{2}-\d{2}$/.test(id.slice(f.length+1))));
const incompatibleModel=/^(?:whisper(?:-|$)|tts(?:-|$)|dall-e(?:-|$)|gpt-image(?:-|$)|chatgpt-image(?:-|$)|text-embedding(?:-|$)|(?:omni|text)-moderation(?:-|$)|gpt-(?:audio|realtime|live|transcribe)(?:-|$)|gpt-4o(?:-mini)?-(?:audio|realtime|transcribe|tts|search-preview)(?:-|$)|babbage(?:-|$)|davinci(?:-|$))/;
export const isAssistantModel=id=>typeof id==='string'&&/^[A-Za-z0-9_.:-]{1,128}$/.test(id)&&!incompatibleModel.test(id);

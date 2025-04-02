
const getSettingsMetas = (t) => {
  const settings = {
    language: [
      {
        name: 'locale',
        type: 'select',
        title: t('App language'),
        needRestart: true,
        description: t('Set language of XStreaming'),
        data: [
          {value: 'en', label: 'English'},
          {value: 'pt', label: 'Português do Brasil'},
          {value: 'zh', label: '简体中文'},
          {value: 'zht', label: '繁體中文'},
          {value: 'jp', label: '日本語'},
        ],
      },
      {
        name: 'preferred_game_language',
        type: 'radio',
        title: t('Preferred language of game'),
        description: t('Set language of cloud game'),
        data: [
          {value: '', label: 'Default'},
          {value: 'ar-SA', label: 'Arabic (Saudi Arabia)'},
          {value: 'cs-CZ', label: 'Czech'},
          {value: 'da-DK', label: 'Danish'},
          {value: 'de-DE', label: 'German'},
          {value: 'el-GR', label: 'Greek'},
          {value: 'en-GB', label: 'English (United Kingdom)'},
          {value: 'en-US', label: 'English (United States)'},
          {value: 'es-ES', label: 'Spanish (Spain)'},
          {value: 'es-MX', label: 'Spanish (Mexico)'},
          {value: 'fi-FI', label: 'Swedish'},
          {value: 'fr-FR', label: 'French'},
          {value: 'he-IL', label: 'Hebrew'},
          {value: 'hu-HU', label: 'Hungarian'},
          {value: 'it-IT', label: 'Italian'},
          {value: 'ja-JP', label: '日本語'},
          {value: 'ko-KR', label: 'Korean'},
          {value: 'nb-NO', label: 'Norwegian'},
          {value: 'nl-NL', label: 'Dutch'},
          {value: 'pl-PL', label: 'Polish'},
          {value: 'pt-BR', label: 'Portuguese (Brazil)'},
          {value: 'pt-PT', label: 'Portuguese (Portugal)'},
          {value: 'ru-RU', label: 'Russian'},
          {value: 'sk-SK', label: 'Slovak'},
          {value: 'sv-SE', label: 'Swedish'},
          {value: 'tr-TR', label: 'Turkish'},
          {value: 'zh-CN', label: '简体中文'},
          {value: 'zh-TW', label: '繁體中文'},
        ],
      },
      {
        name: 'theme',
        type: 'radio',
        title: t('Theme'),
        needRestart: true,
        description: t('Set the app theme'),
        data: [
          {value: 'xbox-dark', label: t('Dark')},
          {value: 'xbox-light', label: t('Light')},
        ],
      },
      {
        name: 'fullscreen',
        type: 'radio',
        title: t('Fullscreen'),
        description: t('Whether open application with fullscreen'),
        data: [
          {value: true, label: t('Enable')},
          {value: false, label: t('Disable')},
        ],
      },
      {
        name: 'fontSize',
        type: 'radio',
        title: t('Font Size'),
        needRestart: true,
        description: t('Set the app font size'),
        data: [
          {value: '14', label: t('Small')},
          {value: '16', label: t('Normal')},
          {value: '18', label: t('Big')},
          {value: '20', label: t('Super Big')},
        ],
      },
    ],
    streaming: [
      {
        name: 'resolution',
        type: 'radio',
        title: t('Resolution'),
        description: t('Set resolution, support 720P/1080P'),
        data: [
          {value: 720, label: '720P'},
          {value: 1080, label: '1080P'},
          {value: 1081, label: '1080P(HQ)'},
        ],
      },
      {
        name: 'video_format',
        type: 'select',
        title: t('Video stream format'),
        description: t(
          'Select video stream format, if you want video fullscreen, please select Stretch or Zoom',
        ),
        data: [
          {value: '', label: t('Aspect ratio')},
          {value: 'Stretch', label: t('Stretch')},
          {value: 'Zoom', label: t('Zoom')},
          {value: '16:10', label: '16:10'},
          {value: '18:9', label: '18:9'},
          {value: '21:9', label: '21:9'},
          {value: '4:3', label: '4:3'},
        ],
      },
      {
        name: 'codec',
        type: 'select',
        title: t('Codec'),
        description: t(
          'If your device supports newer codecs, it can reduce the video bandwidth requirements',
        ),
        data: [
          {value: '', label: 'Auto'},
          {value: 'video/AV1', label: 'AV1'},
          {value: 'video/VP9', label: 'VP9'},
          {value: 'video/VP8', label: 'VP8'},
          {value: 'video/H264-4d', label: 'H264-High'},
          {value: 'video/H264-42e', label: 'H264-Medium'},
          {value: 'video/H264-420', label: 'H264-Low'},
          {value: 'video/flexfec-03', label: 'flexfec-03'},
          {value: 'video/ulpfec', label: 'ulpfec'},
          {value: 'video/rtx', label: 'rtx'},
          {value: 'video/red', label: 'red'},
        ],
      },
      {
        name: 'xhome_bitrate',
        type: 'bitrate',
        title: t('Host stream bitrate'),
        description: t(
          'Set the host streaming bitrate (Note: Higher bitrate is not always better; the final bitrate will be determined by streaming negotiation)',
        )
      },
      {
        name: 'xcloud_bitrate',
        type: 'bitrate',
        title: t('Cloud stream bitrate'),
        description: t(
          'Set the cloud streaming bitrate (Note: Higher bitrate is not always better; the final bitrate will be determined by streaming negotiation)',
        )
      },
      {
        name: 'audio_bitrate',
        type: 'bitrate',
        title: t('Audio bitrate'),
        description: t(
          'Set the streaming audio bitrate',
        )
      },
      {
        name: 'enable_audio_control',
        type: 'radio',
        title: t('Audio_volume_title'),
        description: t('Audio_volume_desc'),
        data: [
          {value: false, label: t('Disable')},
          {value: true, label: t('Enable')},
        ],
      },
    ],
    gamepad: [
      {
        name: 'dead_zone',
        type: 'slider',
        min: 0.1,
        max: 0.9,
        step: 0.01,
        title: t('Joystick dead zone'),
        description: t('Config joystick dead zone'),
        data: [],
      },
      {
        name: 'edge_compensation',
        type: 'slider',
        min: 0,
        max: 0.2,
        step: 0.01,
        title: t('Joystick edge compensation'),
        description: t("If your joystick's maximum value doesn't reach the expected level, you can set maximum value compensation"),
        data: [],
      },
      {
        name: 'vibration',
        type: 'radio',
        title: t('Vibration'),
        description: t(
          'If your controller supports vibration, you can set whether it vibrates during the game',
        ),
        data: [
          {value: true, label: t('Enable')},
          {value: false, label: t('Disable')},
        ],
      },
      {
        name: 'force_trigger_rumble',
        type: 'radio',
        title: t('Trigger rumble'),
        description: t(
          'trigger_rumble_description',
        ),
        data: [
          {value: '', label: t('Disable')},
          {value: 'all', label: t('All')},
          {value: 'left', label: t('Left trigger')},
          {value: 'right', label: t('Right trigger')},
        ],
      },
      {
        name: 'gamepad_index',
        type: 'radio',
        title: t('Select gamepad'),
        description: t('Select specified controller'),
        data: [
          {value: -1, label: t('Auto')},
          {value: 0, label: '1'},
          {value: 1, label: '2'},
          {value: 2, label: '3'},
          {value: 3, label: '4'},
        ],
      },
    ],
    xhome: [
      {
        name: 'power_on',
        type: 'radio',
        title: t('Power on when streaming'),
        description: t('power_on_description'),
        data: [
          {value: true, label: t('Enable')},
          {value: false, label: t('Disable')},
        ],
      },
      {
        name: 'ipv6',
        type: 'radio',
        title: t('Ipv6'),
        description: t('Prioritize using IPv6 connection'),
        data: [
          {value: true, label: t('Enable')},
          {value: false, label: t('Disable')},
        ],
      },
      {
        name: 'signaling_home',
        type: 'select',
        title: t('Signal server') + '(xHome)',
        description: t(
          'The signaling server is a server for stream negotiation. If the host cannot connect, please try modifying this option',
        ),
        data: [],
      },
    ],
    xcloud: [
      {
        name: 'force_region_ip',
        type: 'select',
        title: t('Set region'),
        needRestart: true,
        description: t(
          'Changing the region allows you to use XGPU services without a proxy',
        ),
        data: [
          {value: '', label: t('Default')},
          {value: '203.41.44.20', label: t('Australia')},
          {value: '200.221.11.101', label: t('Brazil')},
          {value: '194.25.0.68', label: t('Europe')},
          {value: '210.131.113.123', label: t('Japan')},
          {value: '168.126.63.1', label: t('Korea')},
          {value: '4.2.2.2', label: t('United States')},
        ],
      },
      {
        name: 'signaling_cloud',
        type: 'select',
        title: t('Signal server') + '(xCloud)',
        description: t(
          'The signaling server is a server for stream negotiation. If the host cannot connect, please try modifying this option',
        ),
        data: [],
      },
    ]
  }

  return settings;
}

export default getSettingsMetas;
import { gettext } from 'i18n';

AppSettingsPage({
  build(props) {
    return Section(
      {},
      [
        Text({
          bold: true,
          paragraph: true,
          label: 'HeavyDuty Sync Settings',
        }),
        Text({
          paragraph: true,
          label: 'Введите ваш персональный ключ синхронизации HeavyDuty для автоматической передачи тренировок с часов Amazfit Balance в веб-приложение.',
        }),
        TextInput({
          label: 'Ключ синхронизации (Sync Key)',
          value: props.settingsStorage.getItem('syncKey') || 'HD-7838-6732',
          onChange: (val) => {
            props.settingsStorage.setItem('syncKey', val.trim().toUpperCase());
          },
        }),
      ]
    );
  },
});

import { ComplianceCheckType } from '../enums/compliance-check-type.enum';
import { _t } from '../renderer/helpers/intl.helpers';

const getComplianceCheckListItems = () => [
    {
        type: ComplianceCheckType[ComplianceCheckType.PASSWORD_MANAGER],
        title: _t({ id: "Install the Company's Approved Password Manager" }),
        instructions: _t({
            id: 'Download and install a password manager on your computer. This is the application you will use to generate, store, and share all passwords, MFA codes, as well as secure notes.',
        }),
        compliantText: _t({ id: 'You are using an approved password manager' }),
        helpLink: {
            label: _t({ id: 'How to download and install a password manager' }),
            href: 'https://help.drata.com/en/articles/4675829-installing-and-using-a-password-manager',
        },
    },
    {
        type: ComplianceCheckType[ComplianceCheckType.HDD_ENCRYPTION],
        title: _t({ id: 'Hard-Disk Encrypted' }),
        instructions: _t({
            id: "You'll need to encrypt your computers hard drive.",
        }),
        compliantText: _t({ id: "Your computer's hard drive is encrypted." }),
        helpLink: {
            label: _t({ id: 'How to encrypt your hard drive' }),
            href: 'https://help.drata.com/en/articles/4675833-encrypting-your-computer-s-hard-drive',
        },
    },
    {
        type: ComplianceCheckType[ComplianceCheckType.AUTO_UPDATES],
        title: _t({ id: 'Automatic Updates Enabled' }),
        instructions: _t({
            id: "You'll need to turn on auto-updates.",
        }),
        compliantText: _t({ id: 'Your computer will automatically update.' }),
        helpLink: {
            label: _t({ id: 'How to turn on auto-updates' }),
            href: 'https://help.drata.com/en/articles/4675832-configuring-automatic-updates-on-your-computer',
        },
    },
    {
        type: ComplianceCheckType[ComplianceCheckType.ANTIVIRUS],
        title: _t({ id: 'Install Anti-Virus/Malware Software' }),
        instructions: _t({
            id: "You'll need to download and install anti-virus software.",
        }),
        compliantText: _t({ id: 'You are using anti-virus software.' }),
        helpLink: {
            label: _t({
                id: 'How to download and install anti-virus software',
            }),
            href: 'https://help.drata.com/en/articles/4675835-installing-and-using-anti-virus-software-on-your-computer',
        },
    },
    {
        type: ComplianceCheckType[ComplianceCheckType.LOCK_SCREEN],
        title: _t({ id: 'Screen Saver Lock' }),
        instructions: _t({
            id: "You'll need to configure your security settings to require your login password within a specific timeframe after your computer goes to sleep or the screen saver begins. Review the help article and check with your IT and compliance teams for specific guidelines.",
        }),
        compliantText: _t({
            id: 'Once your computer goes to sleep or the screen saver begins, your computer will lock within 60 seconds.',
        }),
        helpLink: {
            label: _t({ id: 'How to enable screen saver lock timing' }),
            href: 'https://help.drata.com/en/articles/4675838-setting-your-screensaver-lock-screen-timer',
        },
    },
];

export { getComplianceCheckListItems };

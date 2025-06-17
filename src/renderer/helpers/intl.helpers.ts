import { FormatXMLElementFn, PrimitiveType } from 'intl-messageformat';
import { isNil } from 'lodash';
import { MessageDescriptor, useIntl } from 'react-intl';

/**
 * Translate messages
 * @param {string} id A unique, stable identifier for the message, can be the message itself. If defaultMessage is not found, translation will fallback to this value
 * @param {string} [defaultMessage] The default message
 * @param {string|object} [description] Context for the translator about how the message is used in the UI
 * @param {object} [values] Values used to fill placeholders in the message
 */
function _t(
    { id, defaultMessage, description }: MessageDescriptor,
    values?:
        | Record<string, PrimitiveType | FormatXMLElementFn<string, string>>
        | undefined,
): string {
    if (isNil(id)) {
        throw new Error(
            '[Intl]: _t: An id must be provided to format a message',
        );
    }

    const intl = useIntl();
    return intl.formatMessage({ id, defaultMessage, description }, values);
}

export { _t };

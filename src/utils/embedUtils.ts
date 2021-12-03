import type { APIEmbed } from "discord-api-types";

const limits = {
  title: 256,
  description: 4096,
  fields: 25,
  fieldName: 256,
  fieldValue: 1024,
  footerText: 2048,
  authorName: 256,
  combinedEmbed: 6000,
  maxEmbeds: 10,
  allCombinedEmbed: 6000,
};
/**
 * Sanity check the passed embeds for exceeding any limit
 * @param embeds
 * @param error Whether to error should a limit be exceeded, if not return a boolean, false if it exceeds a limit
 * @returns
 */
export function checkEmbedLimits(embeds: APIEmbed[], error: boolean = false) {
  if (error) {
    const allCombinedEmbedCharacterCount = embeds.reduce(
      (prev, curr) => prev + getCombinedEmbedCharacterCount(curr),
      0
    );
    if (allCombinedEmbedCharacterCount > limits.allCombinedEmbed)
      throw new Error(
        `There are more than ${limits.allCombinedEmbed} characters on all ${embeds.length} embeds combined`
      );
    if (embeds.length > limits.maxEmbeds)
      throw new Error(`There are more than ${limits.maxEmbeds} embeds`);
    embeds.forEach((embed, index) => {
      if (getCombinedEmbedCharacterCount(embed) > limits.combinedEmbed)
        throw new Error(
          `There are more than ${limits.combinedEmbed} combined characters on embed[${index}]`
        );

      const {
        title = "",
        description = "",
        footer: { text = "" } = {},
        author: { name = "" } = {},
        fields = [],
      } = embed;

      if (fields.length > limits.fields)
        throw new Error(
          `There are more than ${limits.fields} fields on embed[${index}]`
        );
      if (title.length > limits.title)
        throw new Error(
          `There are more than ${limits.title} characters on embed[${index}].title`
        );
      if (description.length > limits.description)
        throw new Error(
          `There are more than ${limits.description} characters on embed[${index}].description`
        );
      if (text.length > limits.footerText)
        throw new Error(
          `There are more than ${limits.footerText} characters on embed[${index}].footer.text`
        );
      if (name.length > limits.authorName)
        throw new Error(
          `There are more than ${limits.authorName} characters on embed[${index}].author.name`
        );

      fields.forEach((field, fieldIndex) => {
        if (field.name.length > limits.fieldName)
          throw new Error(
            `There are more than ${limits.fieldName} characters on embed[${index}].fields[${fieldIndex}].name`
          );
        if (field.value.length > limits.fieldValue)
          throw new Error(
            `There are more than ${limits.fieldValue} characters on embed[${index}].fields[${fieldIndex}].value`
          );
      });
    });
  } else {
    const allCombinedEmbedCharacterCount = embeds.reduce(
      (prev, curr) => prev + getCombinedEmbedCharacterCount(curr),
      0
    );
    // Check the character count for all the combined embeds
    if (allCombinedEmbedCharacterCount > limits.allCombinedEmbed) return false;
    // Check the amount of embeds passed
    if (embeds.length > limits.maxEmbeds) return false;
    const allEmbeds = embeds.every((embed, index) => {
      if (getCombinedEmbedCharacterCount(embed) > limits.combinedEmbed)
        return false;

      const {
        title = "",
        description = "",
        footer: { text = "" } = {},
        author: { name = "" } = {},
        fields = [],
      } = embed;
      // Check field count
      if (fields.length > limits.fields) return false;
      // Check title character count
      if (title.length > limits.title) return false;
      // Check description character count
      if (description.length > limits.description) return false;
      // Check footer-text character count
      if (text.length > limits.footerText) return false;
      // Check author-name character count
      if (name.length > limits.authorName) return false;

      const fieldsNameAndValue = fields.every((field, fieldIndex) => {
        // Check field-name character count
        if (field.name.length > limits.fieldName) return false;
        // Check field-value character count
        if (field.value.length > limits.fieldValue) return false;
        return true;
      });
      if (!fieldsNameAndValue) return false;
      return true;
    });
    if (!allEmbeds) return false;
    return true;
  }
}
/**
 * Gets the combined title, description, footer-text, author-name and field character count from an embed
 * @param embed
 * @returns The combined character count from the embed
 */
export function getCombinedEmbedCharacterCount(embed: APIEmbed): number {
  const {
    title = "",
    description = "",
    footer: { text = "" } = {},
    author: { name = "" } = {},
    fields = [],
  } = embed;
  const fieldsCharacterCount = fields.reduce((prev, curr) => {
    const { name = "", value = "" } = curr;
    return prev + name.length + value.length;
  }, 0);
  return (
    title.length +
    description.length +
    text.length +
    name.length +
    fieldsCharacterCount
  );
}

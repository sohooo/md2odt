export const CONTENT_AUTOMATIC_STYLES = `
  <office:automatic-styles>
    <style:style style:name="Table1" style:family="table">
      <style:table-properties style:width="16cm" table:align="margins" table:border-model="collapsing"/>
    </style:style>
    <style:style style:name="TableColumn" style:family="table-column">
      <style:table-column-properties style:rel-column-width="1*"/>
    </style:style>
    <style:style style:name="TableHeaderCell" style:family="table-cell">
      <style:table-cell-properties fo:background-color="#dce8dd" fo:border="0.5pt solid #829087" fo:padding="0.18cm"/>
    </style:style>
    <style:style style:name="TableOddCell" style:family="table-cell">
      <style:table-cell-properties fo:background-color="#ffffff" fo:border="0.5pt solid #aeb8b0" fo:padding="0.18cm"/>
    </style:style>
    <style:style style:name="TableEvenCell" style:family="table-cell">
      <style:table-cell-properties fo:background-color="#f3f6f2" fo:border="0.5pt solid #aeb8b0" fo:padding="0.18cm"/>
    </style:style>
    <style:style style:name="TableTextLeft" style:family="paragraph">
      <style:paragraph-properties fo:text-align="left"/>
    </style:style>
    <style:style style:name="TableTextCenter" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center"/>
    </style:style>
    <style:style style:name="TableTextRight" style:family="paragraph">
      <style:paragraph-properties fo:text-align="right"/>
    </style:style>
  </office:automatic-styles>`

const headingStyles = Array.from({ length: 6 }, (_, index) => {
  const level = index + 1
  const sizes = ['20pt', '16pt', '14pt', '12pt', '11pt', '10.5pt']
  const margins = ['0.45cm', '0.4cm', '0.35cm', '0.3cm', '0.25cm', '0.2cm']
  return `
    <style:style style:name="Heading_20_${level}" style:display-name="Heading ${level}" style:family="paragraph" style:parent-style-name="Heading" style:default-outline-level="${level}" style:class="text">
      <style:paragraph-properties fo:margin-top="${margins[index]}" fo:margin-bottom="0.18cm" fo:keep-with-next="always"/>
      <style:text-properties fo:font-size="${sizes[index]}" fo:font-weight="bold" style:font-size-asian="${sizes[index]}" style:font-weight-asian="bold"/>
    </style:style>`
}).join('')

const tocStyles = Array.from({ length: 6 }, (_, index) => {
  const level = index + 1
  return `
    <style:style style:name="Contents_20_${level}" style:display-name="Contents ${level}" style:family="paragraph" style:parent-style-name="Contents" style:class="index">
      <style:paragraph-properties fo:margin-left="${index * 0.45}cm" fo:margin-bottom="0.08cm"/>
    </style:style>`
}).join('')

const bulletLevels = Array.from({ length: 10 }, (_, index) => {
  const level = index + 1
  return `
      <text:list-level-style-bullet text:level="${level}" text:bullet-char="•">
        <style:list-level-properties text:space-before="${0.65 + index * 0.45}cm" text:min-label-width="0.5cm"/>
      </text:list-level-style-bullet>`
}).join('')

const numberLevels = Array.from({ length: 10 }, (_, index) => {
  const level = index + 1
  return `
      <text:list-level-style-number text:level="${level}" style:num-format="1" style:num-suffix=".">
        <style:list-level-properties text:space-before="${0.65 + index * 0.45}cm" text:min-label-width="0.5cm"/>
      </text:list-level-style-number>`
}).join('')

export function createStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
  office:version="1.3">
  <office:styles>
    <style:default-style style:family="paragraph">
      <style:paragraph-properties fo:orphans="2" fo:widows="2" fo:line-height="120%"/>
      <style:text-properties style:font-name="Liberation Serif" fo:font-size="11pt"/>
    </style:default-style>
    <style:style style:name="Standard" style:family="paragraph" style:class="text"/>
    <style:style style:name="Text_20_body" style:display-name="Text Body" style:family="paragraph" style:parent-style-name="Standard" style:class="text">
      <style:paragraph-properties fo:margin-bottom="0.2cm"/>
    </style:style>
    <style:style style:name="Heading" style:family="paragraph" style:parent-style-name="Standard" style:class="text">
      <style:text-properties style:font-name="Liberation Sans"/>
    </style:style>${headingStyles}
    <style:style style:name="Blockquote" style:display-name="Block Quotation" style:family="paragraph" style:parent-style-name="Text_20_body">
      <style:paragraph-properties fo:margin-left="0.75cm" fo:border-left="1.5pt solid #7c9b83" fo:padding-left="0.35cm"/>
      <style:text-properties fo:color="#526057"/>
    </style:style>
    <style:style style:name="Code_20_Block" style:display-name="Code Block" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:background-color="#eef1ed" fo:padding="0.25cm" fo:margin-bottom="0.2cm"/>
      <style:text-properties style:font-name="Liberation Mono" fo:font-size="9pt"/>
    </style:style>
    <style:style style:name="Footnote" style:family="paragraph" style:parent-style-name="Standard" style:class="extra">
      <style:text-properties fo:font-size="9pt"/>
    </style:style>
    <style:style style:name="Contents" style:family="paragraph" style:parent-style-name="Standard" style:class="index"/>${tocStyles}
    <style:style style:name="Contents_20_Heading" style:display-name="Contents Heading" style:family="paragraph" style:parent-style-name="Heading_20_1" style:class="index"/>
    <style:style style:name="Strong_20_Emphasis" style:display-name="Strong Emphasis" style:family="text">
      <style:text-properties fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Emphasis" style:family="text">
      <style:text-properties fo:font-style="italic"/>
    </style:style>
    <style:style style:name="Source_20_Text" style:display-name="Source Text" style:family="text">
      <style:text-properties style:font-name="Liberation Mono" fo:font-size="9.5pt" fo:background-color="#eef1ed"/>
    </style:style>
    <style:style style:name="Strike" style:family="text">
      <style:text-properties style:text-line-through-style="solid"/>
    </style:style>
    <style:style style:name="TextLink" style:display-name="Internet link" style:family="text">
      <style:text-properties fo:color="#245f3a" style:text-underline-style="solid"/>
    </style:style>
    <text:list-style style:name="BulletList">${bulletLevels}
    </text:list-style>
    <text:list-style style:name="NumberList">${numberLevels}
    </text:list-style>
    <text:notes-configuration text:note-class="footnote" style:num-format="1" text:start-value="1" text:footnotes-position="page"/>
  </office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="PageLayout">
      <style:page-layout-properties fo:page-width="21cm" fo:page-height="29.7cm" style:print-orientation="portrait" fo:margin-top="2cm" fo:margin-bottom="2cm" fo:margin-left="2.5cm" fo:margin-right="2.5cm"/>
    </style:page-layout>
  </office:automatic-styles>
  <office:master-styles>
    <style:master-page style:name="Standard" style:page-layout-name="PageLayout"/>
  </office:master-styles>
</office:document-styles>`
}

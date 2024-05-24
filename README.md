# adapt-pageIncompletePrompt

**Page Incomplete Prompt** is an extension that displays a prompt if you try to leave a page without having completed all required components.

## Settings Overview

**Page Incomplete Prompt** can be configured globally in *course.json*, or per page in *contentObjects.json*. The *contentObjects.json* setting will override whatever is in *course.json*.

## Attributes

All configuration options must be added and amended, where appropriate, for all JSON files.

### *course.json*

The following attributes are set within *course.json*.

### **\_pageIncompletePrompt** (object)

The Page Incomplete Prompt object contains the following settings:

#### **\_isEnabled** (boolean)

Controls whether the extension is enabled

### **title** (string)

The title of the prompt popup

### **message** (string)

The message body of the prompt popup

### **_classes** (string)

CSS class names to be applied to the prompt popup. The class must be predefined in one of the Less files. Separate multiple classes with a space.

### **\_buttons** (object)

This object contains the following settings:

#### **yes** (string)

The text that appears on the 'yes' confirmation button

#### **no** (string)

The text that appears on the 'no' button

### *contentObjects.json*

The following attributes are set within *contentObjects.json*.

### **\_pageIncompletePrompt** (object)

The Page Incomplete Prompt object contains the following settings:

#### **\_isEnabled** (boolean)

Controls whether the extension is enabled for the page

## Limitations

No known limitations.

----------------------------

**Author / maintainer:**  CGKineo<br>
**Accessibility support:**  WAI AA<br>
**RTL support:**  Yes<br>
**Cross-platform coverage:** Chrome, Chrome for Android, Firefox (ESR + latest version), Edge, Safari for macOS/iOS/iPadOS, Opera<br>

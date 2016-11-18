﻿import { TextView as TextViewDefinition } from "ui/text-view";
import { EditableTextBase, editableProperty, hintProperty } from "ui/editable-text-base";
import { textProperty } from "ui/text-base";
import { UpdateTextTrigger } from "ui/enums";
import {
    colorProperty, borderTopWidthProperty, borderRightWidthProperty,
    borderBottomWidthProperty, borderLeftWidthProperty, nativePaddingsProperty
} from "ui/styling/style";
import * as utils from "utils/utils";

export * from "ui/editable-text-base";

class UITextViewDelegateImpl extends NSObject implements UITextViewDelegate {
    public static ObjCProtocols = [UITextViewDelegate];

    private _owner: WeakRef<TextView>;

    public static initWithOwner(owner: WeakRef<TextView>): UITextViewDelegateImpl {
        let impl = <UITextViewDelegateImpl>UITextViewDelegateImpl.new();
        impl._owner = owner;
        return impl;
    }

    public textViewShouldBeginEditing(textView: UITextView): boolean {
        let owner = this._owner.get();
        if (owner) {
            owner._hideHint();
        }

        return true;
    }

    public textViewDidEndEditing(textView: UITextView) {
        let owner = this._owner.get();
        if (owner) {
            if (owner.updateTextTrigger === UpdateTextTrigger.focusLost) {
                owner.nativePropertyChangeded(textProperty, textView.text);
            }

            owner.dismissSoftInput();
            owner._refreshHintState(owner.hint, textView.text);

            if (owner.formattedText) {
                owner.formattedText.createFormattedStringCore();

            }

            // //RemoveThisDoubleCall
            // owner.style._updateTextDecoration();
            // owner.style._updateTextTransform();
        }
    }

    public textViewDidChange(textView: UITextView) {
        let owner = this._owner.get();
        if (owner) {
            if (owner.updateTextTrigger === UpdateTextTrigger.textChanged) {
                owner.nativePropertyChangeded(textProperty, textView.text);
            }
        }
    }

    public textViewShouldChangeTextInRangeReplacementText(textView: UITextView, range: NSRange, replacementString: string): boolean {
        let owner = this._owner.get();
        if (owner && owner.formattedText) {
            owner.formattedText._updateCharactersInRangeReplacementString(range.location, range.length, replacementString);
        }

        return true;
    }
}

export class TextView extends EditableTextBase implements TextViewDefinition {
    private _ios: UITextView;
    private _delegate: UITextViewDelegateImpl;
    private _isShowingHint: boolean;

    public nativeView: UITextView;

    constructor() {
        super();

        this._ios = UITextView.new();
        if (!this._ios.font) {
            this._ios.font = UIFont.systemFontOfSize(12);
        }
        this._delegate = UITextViewDelegateImpl.initWithOwner(new WeakRef(this));
    }

    public onLoaded() {
        super.onLoaded();
        this._ios.delegate = this._delegate;
    }

    public onUnloaded() {
        this._ios.delegate = null;
        super.onUnloaded();
    }

    get ios(): UITextView {
        return this._ios;
    }

    public _refreshHintState(hint: string, text: string) {
        if (hint && !text) {
            this._showHint(hint);
        }
        else {
            this._hideHint();
        }
    }

    public _showHint(hint: string) {
        let nativeView = this.nativeView;
        nativeView.textColor = nativeView.textColor ? nativeView.textColor.colorWithAlphaComponent(0.22) : utils.ios.getter(UIColor, UIColor.blackColor).colorWithAlphaComponent(0.22);
        nativeView.text = hint + "";
        this._isShowingHint = true;
    }

    public _hideHint() {
        let nativeView = this.nativeView;
        nativeView.textColor = this.color ? this.color.ios : null;
        nativeView.text = this.text + "";
        this._isShowingHint = false;
    }

    get [textProperty.native](): string {
        return "";
    }
    set [textProperty.native](value: string) {
        this._refreshHintState(this.hint, value);
    }

    get [hintProperty.native](): string {
        return "";
    }
    set [hintProperty.native](value: string) {
        this._refreshHintState(value, this.text);
    }

    get [editableProperty.native](): boolean {
        return this.nativeView.editable;
    }
    set [editableProperty.native](value: boolean) {
        this.nativeView.editable = value;
    }

    get [colorProperty.native](): UIColor {
        let textView = this.nativeView;
        if (this._isShowingHint && textView.textColor) {
            return textView.textColor.colorWithAlphaComponent(1);
        }
        else {
            return textView.textColor;
        }
    }
    set [colorProperty.native](color: UIColor) {
        let textView = this.nativeView;
        if (this._isShowingHint && color) {
            textView.textColor = color.colorWithAlphaComponent(0.22);
        } else {
            textView.textColor = color;
            textView.tintColor = color;
        }
    }

    get [borderTopWidthProperty.native](): number {
        return this.nativeView.textContainerInset.top;
    }
    set [borderTopWidthProperty.native](value: number) {
        let inset = this.nativeView.textContainerInset;
        let top = this.style.paddingTop + value;
        this.nativeView.textContainerInset = { top: top, left: inset.left, bottom: inset.bottom, right: inset.right };
    }
    get [borderRightWidthProperty.native](): number {
        return this.nativeView.textContainerInset.right;
    }
    set [borderRightWidthProperty.native](value: number) {
        let inset = this.nativeView.textContainerInset;
        let right = this.style.paddingRight + value;
        this.nativeView.textContainerInset = { top: inset.top, left: inset.left, bottom: inset.bottom, right: right };
    }
    get [borderBottomWidthProperty.native](): number {
        return this.nativeView.textContainerInset.bottom;
    }
    set [borderBottomWidthProperty.native](value: number) {
        let inset = this.nativeView.textContainerInset;
        let bottom = this.style.paddingBottom + value;
        this.nativeView.textContainerInset = { top: inset.top, left: inset.left, bottom: bottom, right: inset.right };
    }
    get [borderLeftWidthProperty.native](): number {
        return this.nativeView.textContainerInset.left;
    }
    set [borderLeftWidthProperty.native](value: number) {
        let inset = this.nativeView.textContainerInset;
        let left = this.style.paddingLeft + value;
        this.nativeView.textContainerInset = { top: inset.top, left: left, bottom: inset.bottom, right: inset.right };
    }

    get [nativePaddingsProperty.native](): UIEdgeInsets {
        return this.nativeView.textContainerInset;
    }
    set [nativePaddingsProperty.native](value: UIEdgeInsets) {
        let inset: UIEdgeInsets;
        if (!value) {
            inset = {
                top: this.style.borderTopWidth,
                left: this.style.borderLeftWidth,
                bottom: this.style.borderBottomWidth,
                right: this.style.borderRightWidth
            };
        } else {
            inset = {
                top: this.style.borderTopWidth + value.top,
                left: this.style.borderLeftWidth + value.left,
                bottom: this.style.borderBottomWidth + value.bottom,
                right: this.style.borderRightWidth + value.right
            };
        }

        this.nativeView.textContainerInset = inset;
    }
}
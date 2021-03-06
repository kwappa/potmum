//= require jquery
//= require jquery_ujs
//= require uikit.min
//= require vue
//= require_self

this.Potmum = (function (Potmum) {

    Potmum.createArtcleEditor = function (element) {
        return new Vue({
            el: element,
            data: {
                id: null,
                title: '',
                tags: [],
                body: '',
                preview_html: '',
                publish_flag: 1,
                tagFocus: false
            },
            computed: {
                bodyField: {
                    get: function () { return this.$data.body },
                    set: function (text) {
                        this.$data.body = text;
                        if (this._previewID) clearTimeout(this._previewID);
                        var self = this;
                        this._previewID = setTimeout(function () {
                            self._previewID = null;
                            self.preview();
                        }, 500);
                    }
                }
            },
            ready: function () {
                this.leftAlertFlag = false;
                this.$data.id = $(this.$el).data('id');
                this.$data.tags = $(this.$el).data('tags').split(/\s/).filter(function (n) {
                    return ('' + n).length > 0;
                });
            },
            methods: {
                onRemoveTag: function (e, content) {
                    this.editStart();
                    e.preventDefault();
                    var i = this.$data.tags.indexOf(content);
                    if (i != -1) {
                        this.$data.tags.$remove(i);
                    }
                },
                onBlurTag: function (e) {
                    e.preventDefault();
                    var target = $(e.target);
                    target.val(target.val() + ' ');
                    this.onInputTag(e);
                },
                onInputTag: function (e) {
                    this.editStart();
                    this.$data.tagFocus = true;
                    var target = $(e.target);
                    var contents = target.val().split(/\s|　/);
                    if (contents.length > 1) {
                        for (var i = 0; i < contents.length - 1; ++i) {
                            if (contents[i].length > 0 && this.$data.tags.length < 5 && this.$data.tags.indexOf(contents[i]) == -1) {
                                this.$data.tags.push(contents[i]);
                            }
                        }
                        target.val('');
                    } else {
                        target.css('width', (3 + target.val().length * 2) + 'em');
                    }
                },
                onRemoveLastTag: function (e) {
                    this.editStart();
                    var target = $(e.target);
                    if (this.$data.tags.length > 0 && target.val() == '') {
                        this.$data.tags.$remove(this.$data.tags.length - 1);
                    }
                },
                onClickTagForm: function (e) {
                    e.preventDefault();
                    $(this.$el).find('.js-tag-field').focus();
                },
                onClickPrivateSave: function (e) {
                    e.preventDefault();
                    this.$data.publish_flag = 0;
                    this.submit();
                },
                onClickPublish: function (e) {
                    e.preventDefault();
                    this.$data.publish_flag = 1;
                    this.submit();
                },
                preview: function () {
                    this.editStart();
                    var self = this;
                    $.ajax({
                        url: this.$data.id ? '../preview.json' : '../items/preview.json',
                        type: 'post',
                        data: {
                            body: this.$data.body
                        },
                        success: function (resp) {
                            console.log(resp);
                            self.$data.preview_html = resp.data.markdown_html;
                        }
                    });
                },
                submit: function () {
                    // validation
                    if (this.$data.title.length < 1 || this.$data.title.length > 64) {
                        alert('タイトルを1〜64文字で入力してください。');
                        return;
                    }
                    if (this.$data.body.length < 1 || this.$data.body.length > 100000) {
                        alert('本文を1〜100000文字で入力してください。');
                        return;
                    }

                    // send
                    var self = this;
                    $.ajax({
                        url: this.$data.id ? '../' + this.$data.id + '.json' : '../items.json',
                        type: this.$data.id ? 'put' : 'post',
                        data: {
                            title: this.$data.title,
                            tags_text: this.$data.tags.join(' '),
                            body: this.$data.body,
                            publish_flag: this.$data.publish_flag
                        },
                        success: function (resp) {
                            $(window).off('beforeunload');
                            if (self.$data.publish_flag > 0) {
                                location.href = resp.data.url;
                            } else {
                                location.href = (self.$data.id ? '../' : '') + '../drafts';
                            }
                        },
                        error: function (e) {
                            console.error(e);
                            alert('エラーしたよ');
                        }
                    })
                },
                editStart: function () {
                    if (!this.leftAlertFlag) {
                        this.leftAlertFlag = true;
                        $(window).on('beforeunload', function() {
                            return "このままページを移動すると編集内容が保存されません。";
                        });
                    }
                }
            }
        });
    };

    Potmum.createCommentForm = function (element) {
        if ($(element).length == 0) return;
        return new Vue({
            el: element,
            data: {
                body: '',
                url: '',
                modePreview: false,
                preview_html: ''
            },
            ready: function () {
                this.$data.url = $(this.$el).data('url');
            },
            methods: {
                changeToForm: function (e) {
                    e.preventDefault();
                    this.$data.modePreview = false;
                },
                changeToPreview: function (e) {
                    e.preventDefault();
                    if (this.$data.modePreview) return;
                    this.$data.modePreview = true;
                    var self = this;
                    $.ajax({
                        url: '/comments/preview.json',
                        type: 'post',
                        data: {
                            body: this.$data.body
                        },
                        success: function (resp) {
                            console.log(resp);
                            self.$data.preview_html = resp.data.markdown_html;
                        },
                        error: function (e) {
                            console.error(e);
                            self.$data.preview_html = 'エラーが発生しました';
                        }
                    });
                },
                onSubmit: function (e) {
                    e.preventDefault();
                    $.ajax({
                        url: this.$data.url,
                        type: 'post',
                        data: {
                            body: this.$data.body
                        },
                        success: function (resp) {
                            console.log(resp);
                            location.href = resp.data.url;
                            location.reload();
                        },
                        error: function (e) {
                            console.error(e);
                            alert('エラーが発生しました');
                        }
                    });
                }
            }
        });
    };

    Potmum.createStockButton = function (element) {
        if ($(element).length == 0) return;
        return new Vue({
            el: element,
            data: {
                url: '',
                stocked: false
            },
            ready: function () {
                this.$data.url = $(this.$el).data('url');
                this.$data.stocked = parseInt($(this.$el).data('stocked')) != 0;
            },
            methods: {
                onClick: function (e) {
                    e.preventDefault();
                    this.$data.stocked = !this.$data.stocked;
                    $.ajax({
                        url: this.$data.url,
                        type: 'put',
                        data: {
                            stocked: this.$data.stocked ? 1 : 0
                        }
                    });
                }
            }
        });
    };

    return Potmum;
})(this.Potmum || {});

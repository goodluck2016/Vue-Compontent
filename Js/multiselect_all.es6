/**
 * Created by user on 2016/8/4.
 */
const pointerMixin = {
    data () {
        return {
            pointer: 0,
            visibleElements: this.maxHeight / 40
        }
    },
    props: {
        /**
         * Enable/disable highlighting of the pointed value.
         * @type {Boolean}
         * @default true
         */
        showPointer: {
            type: Boolean,
            default: true
        }
    },
    computed: {
        pointerPosition () {
            return this.pointer * 40
        }
    },
    watch: {
        'filteredOptions' () {
            this.pointerAdjust()
        }
    },
    methods: {
        addPointerElement () {
            if (this.filteredOptions.length > 0) {
                this.select(this.filteredOptions[this.pointer])
            }
            this.pointerReset()
        },
        pointerForward () {
            if (this.pointer < this.filteredOptions.length - 1) {
                this.pointer++
                if (this.$els.list.scrollTop <= this.pointerPosition - this.visibleElements * 40) {
                    this.$els.list.scrollTop = this.pointerPosition - (this.visibleElements - 1) * 40
                }
            }
        },
        pointerBackward () {
            if (this.pointer > 0) {
                this.pointer--
                if (this.$els.list.scrollTop >= this.pointerPosition) {
                    this.$els.list.scrollTop = this.pointerPosition
                }
            }
        },
        pointerReset () {
            if (!this.closeOnSelect) return

            this.pointer = 0
            if (this.$els.list) {
                this.$els.list.scrollTop = 0
            }
        },
        pointerAdjust () {
            if (this.pointer >= this.filteredOptions.length - 1) {
                this.pointer = this.filteredOptions.length
                    ? this.filteredOptions.length - 1
                    : 0
            }
        },
        pointerSet (index) {
            this.pointer = index
        }
    }
}

const deepClone = function (obj) {
    if (Array.isArray(obj)) {
        return obj.map(deepClone)
    } else if (obj && typeof obj === 'object') {
        var cloned = {}
        var keys = Object.keys(obj)
        for (var i = 0, l = keys.length; i < l; i++) {
            var key = keys[i]
            cloned[key] = deepClone(obj[key])
        }
        return cloned
    } else {
        return obj
    }
}

const multiselectMixin = {
    data () {
        return {
            search: '',
            isOpen: false,
            value: this.selected ? deepClone(this.selected) : this.multiple ? [] : null
        }
    },
    props: {
        /**
         * Array of available options: Objects, Strings or Integers.
         * If array of objects, visible label will default to option.label.
         * If `labal` prop is passed, label will equal option['label']
         * @type {Array}
         */
        options: {
            type: Array,
            required: true
        },
        /**
         * Equivalent to the `multiple` attribute on a `<select>` input.
         * @default false
         * @type {Boolean}
         */
        multiple: {
            type: Boolean,
            default: false
        },
        /**
         * Presets the selected options value.
         * @type {Object||Array||String||Integer}
         */
        selected: {},
        /**
         * Key to compare objects
         * @default 'id'
         * @type {String}
         */
        key: {
            type: String,
            default: false
        },
        /**
         * Label to look for in option Object
         * @default 'label'
         * @type {String}
         */
        label: {
            type: String,
            default: false
        },
        /**
         * Enable/disable search in options
         * @default true
         * @type {Boolean}
         */
        searchable: {
            type: Boolean,
            default: true
        },
        /**
         * Clear the search input after select()
         * @default true
         * @type {Boolean}
         */
        clearOnSelect: {
            type: Boolean,
            default: true
        },
        /**
         * Hide already selected options
         * @default false
         * @type {Boolean}
         */
        hideSelected: {
            type: Boolean,
            default: false
        },
        /**
         * Equivalent to the `placeholder` attribute on a `<select>` input.
         * @default 'Select option'
         * @type {String}
         */
        placeholder: {
            type: String,
            default: 'Select option'
        },
        /**
         * Sets maxHeight style value of the dropdown
         * @default 300
         * @type {Integer}
         */
        maxHeight: {
            type: Number,
            default: 300
        },
        /**
         * Allow to remove all selected values
         * @default true
         * @type {Boolean}
         */
        allowEmpty: {
            type: Boolean,
            default: true
        },
        /**
         * Reset this.value, this.search, this.selected after this.value changes.
         * Useful if want to create a stateless dropdown, that fires the this.onChange
         * callback function with different params.
         * @default false
         * @type {Boolean}
         */
        resetAfter: {
            type: Boolean,
            default: false
        },
        /**
         * Enable/disable closing after selecting an option
         * @default true
         * @type {Boolean}
         */
        closeOnSelect: {
            type: Boolean,
            default: true
        },
        /**
         * Function to interpolate the custom label
         * @default false
         * @type {Function}
         */
        customLabel: {
            type: Function,
            default: false
        },
        /**
         * Disable / Enable tagging
         * @default false
         * @type {Boolean}
         */
        taggable: {
            type: Boolean,
            default: false
        },
        /**
         * String to show when highlighting a potential tag
         * @default 'Press enter to create a tag'
         * @type {String}
         */
        tagPlaceholder: {
            type: String,
            default: 'Press enter to create a tag'
        },
        /**
         * Number of allowed selected options. No limit if false.
         * @default False
         * @type {Number}
         */
        max: {
            type: Number,
            default: false
        },
        /**
         * Will be passed with all events as second param.
         * Useful for identifying events origin.
         * @default null
         * @type {String|Integer}
         */
        id: {
            default: null
        }
    },
    created () {
        if (this.searchable) this.adjustSearch()
    },
    computed: {
        filteredOptions () {
            let search = this.search || ''
            let options = this.hideSelected
                ? this.options.filter(this.isNotSelected)
                : this.options
            options = this.$options.filters.filterBy(options, this.search)
            if (this.taggable && search.length && !this.isExistingOption(search)) {
                options.unshift({ isTag: true, label: search })
            }
            return options
        },
        valueKeys () {
            if (this.key) {
                return this.multiple
                    ? this.value.map(element => element[this.key])
                    : this.value[this.key]
            } else {
                return this.value
            }
        },
        optionKeys () {
            return this.label
                ? this.options.map(element => element[this.label])
                : this.options
        },
        currentOptionLabel () {
            return this.getOptionLabel(this.value)
        }
    },
    watch: {
        'value' () {
            if (this.resetAfter) {
                this.$set('value', null)
                this.$set('search', null)
                this.$set('selected', null)
            }
            this.adjustSearch()
        },
        'search' () {
            /* istanbul ignore else */
            if (this.search !== this.currentOptionLabel) {
                this.$emit('search-change', this.search, this.id)
            }
        },
        'selected' (newVal, oldVal) {
            this.value = deepClone(this.selected)
        }
    },
    methods: {
        /**
         * Finds out if the given query is already present
         * in the available options
         * @param  {String}
         * @returns {Boolean} returns true if element is available
         */
        isExistingOption (query) {
            return !this.options
                ? false
                : this.optionKeys.indexOf(query) > -1
        },
        /**
         * Finds out if the given element is already present
         * in the result value
         * @param  {Object||String||Integer} option passed element to check
         * @returns {Boolean} returns true if element is selected
         */
        isSelected (option) {
            /* istanbul ignore else */
            if (!this.value) return false
            const opt = this.key
                ? option[this.key]
                : option

            if (this.multiple) {
                return this.valueKeys.indexOf(opt) > -1
            } else {
                return this.valueKeys === opt
            }
        },
        /**
         * Finds out if the given element is NOT already present
         * in the result value. Negated isSelected method.
         * @param  {Object||String||Integer} option passed element to check
         * @returns {Boolean} returns true if element is not selected
         */
        isNotSelected (option) {
            return !this.isSelected(option)
        },
        /**
         * Returns the option[this.label]
         * if option is Object. Otherwise check for option.label.
         * If non is found, return entrie option.
         *
         * @param  {Object||String||Integer} Passed option
         * @returns {Object||String}
         */
        getOptionLabel (option) {
            if (typeof option === 'object' && option !== null) {
                if (this.customLabel) {
                    return this.customLabel(option)
                } else {
                    if (this.label && option[this.label]) {
                        return option[this.label]
                    } else if (option.label) {
                        return option.label
                    }
                }
            } else {
                return option
            }
        },
        /**
         * Add the given option to the list of selected options
         * or sets the option as the selected option.
         * If option is already selected -> remove it from the results.
         *
         * @param  {Object||String||Integer} option to select/deselect
         */
        select (option) {
            if (this.max && this.multiple && this.value.length === this.max) return
            if (option.isTag) {
                this.$emit('tag', option.label, this.id)
                this.search = ''
            } else {
                if (this.multiple) {
                    if (!this.isNotSelected(option)) {
                        this.removeElement(option)
                    } else {
                        this.value.push(option)

                        this.$emit('select', deepClone(option), this.id)
                        this.$emit('update', deepClone(this.value), this.id)
                    }
                } else {
                    const isSelected = this.isSelected(option)

                    /* istanbul ignore else */
                    if (isSelected && !this.allowEmpty) return

                    this.value = isSelected ? null : option

                    this.$emit('select', deepClone(option), this.id)
                    this.$emit('update', deepClone(this.value), this.id)
                }

                if (this.closeOnSelect) this.deactivate()
            }
        },
        /**
         * Removes the given option from the selected options.
         * Additionally checks this.allowEmpty prop if option can be removed when
         * it is the last selected option.
         *
         * @param  {type} option description
         * @returns {type}        description
         */
        removeElement (option) {
            /* istanbul ignore else */
            if (!this.allowEmpty && this.value.length <= 1) return

            if (this.multiple && typeof option === 'object') {
                const index = this.valueKeys.indexOf(option[this.key])
                this.value.splice(index, 1)
            } else {
                this.value.$remove(option)
            }
            this.$emit('remove', deepClone(option), this.id)
            this.$emit('update', deepClone(this.value), this.id)
        },
        /**
         * Calls this.removeElement() with the last element
         * from this.value (selected element Array)
         *
         * @fires this#removeElement
         */
        removeLastElement () {
            /* istanbul ignore else */
            if (this.search.length === 0 && Array.isArray(this.value)) {
                this.removeElement(this.value[this.value.length - 1])
            }
        },
        /**
         * Opens the multiselect’s dropdown.
         * Sets this.isOpen to TRUE
         */
        activate () {
            /* istanbul ignore else */
            if (this.isOpen) return

            this.isOpen = true
            /* istanbul ignore else  */
            if (this.searchable) {
                this.search = ''
                this.$els.search.focus()
            } else {
                this.$el.focus()
            }
            this.$emit('open', this.id)
        },
        /**
         * Closes the multiselect’s dropdown.
         * Sets this.isOpen to FALSE
         */
        deactivate () {
            /* istanbul ignore else */
            if (!this.isOpen) return

            this.isOpen = false
            /* istanbul ignore else  */
            if (this.searchable) {
                this.$els.search.blur()
                this.adjustSearch()
            } else {
                this.$el.blur()
            }
            this.$emit('close', deepClone(this.value), this.id)
        },
        /**
         * Adjusts the Search property to equal the correct value
         * depending on the selected value.
         */
        adjustSearch () {
            if (!this.searchable || !this.clearOnSelect) return

            this.search = this.multiple
                ? ''
                : this.currentOptionLabel
        },
        /**
         * Call this.activate() or this.deactivate()
         * depending on this.isOpen value.
         *
         * @fires this#activate || this#deactivate
         * @property {Boolean} isOpen indicates if dropdown is open
         */
        toggle () {
            this.isOpen
                ? this.deactivate()
                : this.activate()
        }
    }
}

Vue.component('multiselect', {
    mixins: [multiselectMixin, pointerMixin],
    template: `<div tabindex="0" :class="{ 'multiselect--active': isOpen, 'multiselect--disabled': disabled }" @focus="activate()" @blur="searchable ? false : deactivate()" @keydown.self.down.prevent="pointerForward()"
            @keydown.self.up.prevent="pointerBackward()" @keydown.enter.stop.prevent.self="addPointerElement()" @keyup.esc="deactivate()" class="multiselect">
        <div @mousedown.prevent="toggle()" class="multiselect__select"></div>
        <div v-el:tags class="multiselect__tags">
        <span v-if="multiple" v-for="option in visibleValue" track-by="$index" onmousedown="event.preventDefault()" class="multiselect__tag">
            <span v-text="getOptionLabel(option)"></span>
            <i aria-hidden="true" tabindex="1" @keydown.enter.prevent="removeElement(option)" @mousedown.prevent="removeElement(option)" class="multiselect__tag-icon"></i>
        </span>
            <template v-if="value && value.length > limit">
                <strong v-text="limitText(value.length - limit)"></strong>
            </template>
            <div v-show="loading" transition="multiselect__loading" class="multiselect__spinner"></div>
            <input name="search" type="text" autocomplete="off" :placeholder="placeholder" v-el:search v-if="searchable"
                    v-model="search"
                    :disabled="disabled"
                    @focus.prevent="activate()"
                    @blur.prevent="deactivate()"
                    @keyup.esc="deactivate()"
                    @keyup.down="pointerForward()"
                    @keyup.up="pointerBackward()"
                    @keydown.enter.stop.prevent.self="addPointerElement()"
                    @keydown.delete="removeLastElement()"
                    class="multiselect__input"/>
          <span
                  v-if="!searchable && !multiple"
                  class="multiselect__single"
                  v-text="currentOptionLabel || placeholder">
          </span>
        </div>
        <ul
                transition="multiselect"
                :style="{ maxHeight: maxHeight + 'px' }"
                v-el:list
                v-show="isOpen"
                class="multiselect__content">
            <slot name="beforeList"></slot>
            <li v-if="multiple && max === value.length">
          <span class="multiselect__option">
            <slot name="maxElements">Maximum of {{ max }} options selected. First remove a selected option to select another.</slot>
          </span>
            </li>
            <template v-if="!max || value.length < max">
                <li v-for="option in filteredOptions" track-by="$index">
            <span
                    tabindex="0"
                    :class="{ 'multiselect__option--highlight': $index === pointer && this.showPointer, 'multiselect__option--selected': !isNotSelected(option) }"
                    @mousedown.prevent="select(option)"
                    @mouseenter="pointerSet($index)"
                    :data-select="option.isTag ? tagPlaceholder : selectLabel"
                    :data-selected="selectedLabel"
                    :data-deselect="deselectLabel"
                    class="multiselect__option"
                    v-text="getOptionLabel(option)">
            </span>
                </li>
            </template>
            <li v-show="filteredOptions.length === 0 && search">
          <span class="multiselect__option">
            <slot name="noResult">No elements found. Consider changing the search query.</slot>
          </span>
            </li>
            <slot name="afterList"></slot>
        </ul>
    </div>`,
    props: {
        /**
         * String to show when pointing to an option
         * @default 'Press enter to select'
         * @type {String}
         */
        selectLabel: {
            type: String,
            default: 'Press enter to select'
        },
        /**
         * String to show next to selected option
         * @default 'Selected'
         * @type {String}
         */
        selectedLabel: {
            type: String,
            default: 'Selected'
        },
        /**
         * String to show when pointing to an alredy selected option
         * @default 'Press enter to remove'
         * @type {String}
         */
        deselectLabel: {
            type: String,
            default: 'Press enter to remove'
        },
        /**
         * Decide whether to show pointer labels
         * @default true
         * @type {Boolean}
         */
        showLabels: {
            type: Boolean,
            default: true
        },
        /**
         * Limit the display of selected options. The rest will be hidden within the limitText string.
         * @default 'label'
         * @type {String}
         */
        limit: {
            type: Number,
            default: 99999
        },
        /**
         * Function that process the message shown when selected
         * elements pass the defined limit.
         * @default 'and * more'
         * @param {Int} count Number of elements more than limit
         * @type {Function}
         */
        limitText: {
            type: Function,
            default: count => `and ${count} more`
        },
        /**
         * Set true to trigger the loading spinner.
         * @default False
         * @type {Boolean}
         */
        loading: {
            type: Boolean,
            default: false
        },
        /**
         * Disables the multiselect if true.
         * @default false
         * @type {Boolean}
         */
        disabled: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        visibleValue () {
            return this.multiple
                ? this.value.slice(0, this.limit)
                : this.value
        }
    },
    ready () {
        /* istanbul ignore else */
        if (!this.showLabels) {
            this.deselectLabel = this.selectedLabel = this.selectLabel = ''
        }
    }

})
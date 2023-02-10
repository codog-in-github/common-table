import { isEmpty, isFunction } from "./utils"
import './style.less'

export default {
    name: 'filter-bar',
    props: {
        filters: {
            type: Array,
            default: () => [],
        },
        size: {
            type: String,
            default: 'mini'
        },
        loading: {
            type: Boolean,
            default: false,
        },
    },
    methods: {
        getParams () {
            const params = {}
            for(const filter of this.filters){
                if(isFunction(filter.customParams)) {
                    const data = filter.customParams(filter.value)
                    if(filter.key) {
                        params[filter.key] = data
                    } else {
                        for(const key in data) {
                            params[key] = data[key]
                        }
                    }
                } else if(!isEmpty(filter.value)) {
                    params[filter.key] = filter.value
                }
            }
            return params
        },
        onSearch () {
            this.$emit('search', this.getParams())
        }
    },
    render () {
        return <div class="filter-bar">
                {
                    this.filters.map(item => {
                        const props = item.props ?? {}
                        let children = item.childrenRender ?? null
                        if(!children) {
                            switch (item.name) {
                                case 'el-select':
                                    children = item.children.map(child => <ElOption label={child.label} value={child.value}></ElOption>)
                            }
                        }
                        return <div class="filter-bar__item">
                            <span class="filter-bar__item-label">{item.label}</span>
                            { h(
                                item.name ?? 'el-input',
                                {
                                    props:{
                                        value: item.value,
                                        size: this.size,
                                        placeholder: item.placeholder,
                                        clearable: item.clearable ?? true,
                                        ...props
                                    },
                                    on: {
                                        input: val => {item.value = val}
                                    },
                                    attrs: item.attrs,
                                },
                                children
                            ) }
                        </div>
                    })
                    
                }
                {this.$scopedSlots.search ? this.$scopedSlots.search({ onSearch: this.onSearch }) : <div class="filter-bar__item">
                    <ElButton
                        type="primary"
                        size={this.size}
                        onClick={this.onSearch}
                        loading={this.loading}
                    >搜索</ElButton>
                </div>}
                {this.$slots.default}
            </div>
    }
}
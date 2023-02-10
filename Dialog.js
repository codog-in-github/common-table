import { isArray, isFunction } from "@/lib/check"

const dataTypes = {
    number(val) {
        return Number(val)
    },
    default(val){
        return val
    }
}


export default {
    name: 'common-dialog',
    props: {
        dialogProps: {
            type: '',
            default: () => ({})
        },
        formProps: {
            type: '',
            default: () => ({})
        },
        submit: {
            type: Function,
        },
        cancel: {
            type: Function,
        },
        fields: {
            type: Array,
            default: () => []
        }
    },
    data () {
        return {
            form: {},
            visible: false,
        }
    },
    computed: {
        rules () {
            const validatorDecorate = validator => {
                return (_, val, cb) => {
                    const decorateCb = res => {
                        if(res) {
                            cb(res)
                        } else {
                            cb()
                        }
                    }
                    validator(val, this.form, decorateCb)
                }
            }
            const rules = {}
            for(const field of this.fields) {
                if(!field.key) continue
                const rule = field.rule
                if(field.required === true || (
                    isFunction(field.required) && field.required(this.form)
                )) {
                    const requiredRule = { required: true, message: field.label + '必填' }
                    if(rule) {
                        if (isArray(rule)) {
                            rule = [requiredRule, ...rule]
                        } else {
                            rule = [requiredRule, rule]
                        }
                    } else {
                        rule = requiredRule
                    }
                }
                if (rule) {
                    if(isArray(rule)) {
                        rule.forEach(item => {
                            if(item.validator) {
                                item.validator = validatorDecorate(item.validator)
                            }
                        })
                    } else {
                        if(rule.validator) {
                            rule.validator = validatorDecorate(rule.validator)
                        }
                    }
                    rules[field.key] = rule
                }
            }
            return rules
        }
    },
    methods: {
        show (data = {}) {
            data = { ...data }
            this.fields.forEach(field => {
                if(field.key && !(field.key in data)){
                    data[field.key] = undefined
                }
            })
            this.form = data
            this.visible = true
            this.$nextTick(() => {
                this.$refs.form.clearValidate()
            })
        },
        async onCancel () {
            if(this.cancel) {
                await this.cancel(this.form)
            }
            this.visible = false
        }
    },
    render () {
        const childrenCreater = (config) => {
            if (config.name === 'el-select') {
                return config.children.map(child => {
                    return <ElOption value={child.value} label={child.label} key={child.value}></ElOption>
                })
            } else if(config.name === 'el-radio-group') {
                return config.children.map(child => {
                    return <ElRadio label={child.value} key={child.value}>{child.label}</ElRadio>
                })
            } else if(config.name === 'el-checkbox-group') {
                return config.children.map(child => {
                    return <ElCheckbox label={child.value} key={child.value}>{child.label}</ElCheckbox>
                })
            } else {
                return config.children
            }
        }

        return <ElDialog
            visible={this.visible}
            onClose={this.onCancel}
            {...this.dialogProps}
        >
            {this.$slots.before}
            <ElForm
                ref="form"
                size="mini"
                props={{ model: this.form }}
                labelWidth="140px"
                rules={this.rules}
                {...this.formProps}
            >
                {this.fields.map((item, i) => {
                    if(item.show !== undefined) {
                        let show = item.show
                        if(isFunction(show)) {
                            show = show(this.form)
                        }
                        if(!show) {
                            return null
                        }
                    }
                    return <ElFormItem label={item.label} prop={item.key} key={i}>
                        {
                            item.render
                                ? item.render(this.form) :
                                h(
                                    item.name ?? 'el-input',
                                    {
                                        props: {
                                            value: dataTypes[item.dataType ?? 'default'](this.form[item.key]),
                                            ...item.props
                                        },
                                        on: { input: val => { this.form[item.key] = val } },
                                        attrs: {
                                            placeholder: item.placeholder,
                                            ...item.attrs
                                        }
                                    },
                                    childrenCreater(item)
                                )
                        }
                    </ElFormItem>
                })}
            </ElForm>
            {this.$slots.after}
            <div slot="footer">
                {this.$slots.footer ?? [
                    <ElButton size="mini" type="primary" onClick={ async () => {
                        await this.$refs.form.validate()
                        if(this.submit) {
                            await this.submit(this.form)
                        }
                        this.visible = false
                    } } >确定</ElButton>,
                    <ElButton size="mini" onClick={this.onCancel}>取消</ElButton>
                ] }
            </div>
        </ElDialog>
    }
}
/**
 * 基于elementUI公用表格组件
 * @auth zjy<zhaojangyu@gmail.com>
 * props:
 *     columns {object[]} 表格列
 *         label  {string} 表头文字
 *         key    {string} 字段 key
 *         width  {string} 列宽（需单位）
 *         align  {string} 对齐方式 default 'center'
 *         render {(({row , $index}) => renderFunction)} 自定义渲染函数 即 elTableColumn 中的default插槽
 *         preDef { object } 预定义组件
 *     options {object} 操作列
 *         width   {string} 列宽（需单位）
 *         align   {string} 对齐方式 default 'center'
 *         maxNums {number|false} TODO 最多显示按钮数量 超出数量则被折叠
 *         maxText {string} TODO 折叠按钮组的名称 default '更多操作'
 *         buttons {object<string, function> | ({row, $index}) => object<string, function>}
 *             按钮 key 为按钮名称 value 按钮点点击事件回调 回调函数参数为 el-table-column 作用域插槽参数
 *             或者是返回上述对象的函数，参数为 el-table-column 作用域插槽参数
 *      tableProps {object}   传递给 el-table 的props
 *      filters    {object[]} 过滤器字段 详见 ./FilterBar.js
 *      noPage     {boolean}  数据是否分页 default false
 *      listAPI    {function} 返回表格数据的函数
 *          参数 filterbar结果 returns Promise<表格数据>
 *      fetched    {function} 获取数据后的钩子函数 表格数据会被替换为该函数的返回值
 *      selectable {boolean}  是否显示多选框 可以通过 selectedRows访问被选中列
 *      fieldMap   {object}   字段名称对应关系
 *          request 发起请求时参数的字段名
 *              page
 *                  current 当前页
 *                  size    每页数量
 *          response 接收数据时 接口中的字段名
 *              list 数据列表
 *              page
 *                  current   当前页
 *                  size      每页数量
 *                  total     总条数
 *                  pageCount 总页数
 * 
 * methods
 *      reload 刷新列表
 * 
 * slots
 *     default 表格和fliterbar之间
 *     bar filterbar之后
 *     search 搜索按钮
 *         slotscoped参数
 *         onSearch {void => void} 搜索回调
 */
import { isFunction } from "@/lib/check"
import { objectMerge } from "@/lib/util"
import FilterBar from "./FilterBar"
import './style.less'

export default {
    name: 'common-table',
    components: {
        FilterBar
    },
    props: {
        columns: {
            type: Array,
            default: () => []
        },
        options: {
            type: Object,
            default: null
        },
        tableProps: {
            type: Object,
            default: () => ({})
        },
        filters : {
            type: Array,
            default: null
        },
        noPage: {
            type: Boolean,
            default: false
        },
        listAPI: {
            type: Function
        },
        fetched: {
            type: Function
        },
        fieldMap: {
            type: Object,
            default: () => ({})
        },
        selectable: {
            type: Boolean,
            default: false
        }
    },
    data () {
        return {
            tableData: [],
            loading: false,
            page: {
                current: 1,    //当前页
                total: 1,     // 总条数
                size: 20,     //每页条数
                pageCount: 1, // 总页数
            },
            sort: {},
            selectedRows: []
        }
    },
    mounted () {
        if (this.reloadOnMonted !== false) {
            this.params = this.$refs.filterBar?.getParams() ?? {}
            this.reload()
        }
    },
    created () {
        this._fieldMap = objectMerge(
            {
                response: {
                    list: 'list',
                    page: {
                        current: 'current',
                        total: 'total',
                        size: 'size',
                        pageCount:'pageCount',
                    }
                },
                request: {
                    page: {
                        current: 'current',
                        total: 'total',
                        size: 'size',
                        pageCount:'pageCount',
                    }
                },
            },
            this.fieldMap
        )
    },
    methods: {
        async reload () {
            this.loading = true
            this.selectedRows = []
            let params = {
                ...this.params,
                ...this.sort
            }
            if(!this.noPage) {
                params[this._fieldMap.request.page.current] = this.page.current
                params[this._fieldMap.request.page.size] = this.page.size
            }
            const rep = await this.listAPI(params)
            if(this.fetched) {
                this.tableData = this.fetched(rep)
            } else {
                this.tableData = this.noPage
                    ? rep
                    : (rep[this._fieldMap.response.list] ?? [])
            }
            if(!this.noPage) {
                this.page.size = rep[this._fieldMap.response.page.size]
                this.page.total = rep[this._fieldMap.response.page.total]
                this.page.current = rep[this._fieldMap.response.page.current]
                this.page.pageCount = rep[this._fieldMap.response.page.pageCount]
            }
            this.loading = false
        },
        onSearch (params) {
            this.params = params
            this.page.current = 1
            this.reload()
        },
        onPageChange (page) {
            this.page.current = page
            this.reload()
        },
        onSort ({ prop, order }) {
            this.sort = order ? {
                type: ({ ascending: 'asc', descending: 'desc'})[order],
                field: prop
            } : {}
            this.reload()
        }
    },

    render () {
        const preDefComp = {
            'switch' : (props = {}, column) => ({ row }) => <ElSwitch
                value={row[props.valueKey ?? column.key]}
                activeValue={props.activeValue ?? 1}
                inactiveValue={props.inactiveValue ?? 0}
                activeText={props.activeText ?? "正常"}
                inactiveText={props.inactiveText ?? "禁用"}
                onInput={async val => {
                    await (props.onSwitch ?? function(){})(val, row)
                    row[props.valueKey ?? column.key] = val
                }}
            ></ElSwitch>
        }
        
        const scopedSlotsCreater = column => {
            if(column.render && isFunction(column.render)) {
                return { default: props => column.render(props) }
            } else if (column.preDef in preDefComp) {
                return { default: preDefComp[column.preDef]({}, column) }
            } if (column.preDef?.name in preDefComp) {
                return { default: preDefComp[column.preDef.name](column.preDef, column) }
            }
            return null
        }

        const columnCreater = column => {
            const props = {
                prop: column.key,
                label: column.label,
                sortable: column.sort && "custom" ,
                align: column.align ?? "center",
                width: column.width,
            }
            const scopedSlots = scopedSlotsCreater(column)
            const args = [
                'el-table-column',
                { props, scopedSlots }
            ]
            if(column.children) {
                args.push(column.children.map(columnCreater))
            }
            return h(...args)
        }

        const optionsRender = this.options ? <elTableColumn
            fixed="right"
            label={this.options.label ?? "操作"}
            width={this.options.width}
            align={this.options.align ?? "center"}
            scopedSlots={{
                default: props => {
                    let buttonsConfig
                    if(isFunction(this.options.buttons)) {
                        buttonsConfig = this.options.buttons(props)
                    } else {
                        buttonsConfig = this.options.buttons
                    }
                    const buttons = []
                    for(const name in buttonsConfig) {
                        buttons.push(
                            <ElButton type="text" onClick={() => buttonsConfig[name](props)}>{name}</ElButton>
                        )
                    }
                    return buttons
                }
            }}
        ></elTableColumn> : null

        return <div class="common-table">
            { this.filters ? <FilterBar
                ref="filterBar"
                hiddenSearchButton={this.hiddenSearchButton}
                loading={this.loading}
                filters={this.filters}
                onSearch={this.onSearch}
                scopedSlots={this.$scopedSlots}
            >{this.$slots.bar}</FilterBar> : null }
            {this.$slots.default}
            <ElTable
                vLoading={this.loading}
                elementLoadingBackground="#ffffffaa"
                border
                stripe
                height="100%"
                data={this.tableData}
                on-sort-change={this.onSort}
                props={this.tableProps}
            >
                {this.selectable ? <ElTableColumn
                    align="center"
                    width="50px"
                    scopedSlots={{
                        default: ({ row }) => <ElCheckbox
                            value={this.selectedRows.includes(row)}
                            onInput={val => {
                                if(val) {
                                    this.selectedRows.push(row)
                                } else {
                                    this.selectedRows.splice(
                                        this.selectedRows.indexOf(row), 1
                                    )
                                }
                            }}
                        ></ElCheckbox>,
                        header: () => <ElCheckbox
                            value={this.selectedRows.length === this.tableData.length}
                            onInput={val => {
                                if (val) {
                                    this.selectedRows = [...this.tableData]
                                } else {
                                    this.selectedRows = []
                                }
                            }}
                        ></ElCheckbox>
                    }}
                ></ElTableColumn> : null}
                {this.columns.map(columnCreater)}
                {optionsRender}
            </ElTable>
            { !this.noPage ? <ElPagination
                currentPage={this.page.current}
                onCurrent-change={page => {
                    this.page.current = page
                    this.reload()
                }}
                total={this.page.total}
                pageCount={this.page.pageCount}
                layout="prev,pager,next,total"
                pageSizes={[10, 20, 30]}
            ></ElPagination> : null }
        </div>
    }
}

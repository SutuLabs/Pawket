/* eslint-disable */
import Sortable from 'sortablejs'

const createSortable = (el:HTMLElement, options:Sortable.Options, vnode) => {
    return Sortable.create(el, {
        ...options,
        onEnd: function (evt) {
            const data = vnode.componentInstance.$data.tags
            const item = data[evt.oldIndex]
            if (evt.newIndex > evt.oldIndex) {
                for (let i = evt.oldIndex; i < evt.newIndex; i++) {
                    data[i] = data[i + 1]
                }
            } else {
                for (let i = evt.oldIndex; i > evt.newIndex; i--) {
                    data[i] = data[i - 1]
                }
            }
            data[evt.newIndex] = item
            vnode.componentInstance.$emit('input', data)
            // vnode.context.$buefy.toast.open(`Moved ${item} from row ${evt.oldIndex + 1} to ${evt.newIndex + 1}`)
        }
    })
}

/**
 * We add a new instance of Sortable when the element
 * is bound or updated, and destroy it when it's unbound.
 */
const sortable = {
    name: 'sortable',
    bind(el:HTMLElement, binding, vnode): void {
        const container = el.querySelector('.taginput-container')
        container._sortable = createSortable(container, binding.value, vnode)
    },
    update(el:HTMLElement, binding, vnode): void {
        const container = el.querySelector('.taginput-container')
        container._sortable.destroy()
        container._sortable = createSortable(container, binding.value, vnode)
    },
    unbind(el:HTMLElement): void {
        const container = el.querySelector('.taginput-container')
        container._sortable.destroy()
    }
}

export { sortable };
/* eslint-enable */
const Alignment = {
    HORIZONTAL: "horizontal",
    VERTICAL: "vertical",
    NONE: "none",
}

const Direction = {
    LEFT: "left",
    RIGHT: "right",
    TOP: "top",
    BOTTOM: "bottom",
}

function get_dimensions(element) {

    const style = getComputedStyle(element);

    const padding = {
        left: parseFloat(style.paddingLeft),
        right: parseFloat(style.paddingRight),
        top: parseFloat(style.paddingTop),
        bottom: parseFloat(style.paddingBottom),
    }

    const border = {
        left: parseFloat(style.borderLeftWidth),
        right: parseFloat(style.borderRightWidth),
        top: parseFloat(style.borderTopWidth),
        bottom: parseFloat(style.borderBottomWidth),
    }

    return {
        width: element.offsetWidth - padding.left - padding.right - border.left - border.right,
        height: element.offsetHeight - padding.top - padding.bottom - border.top - border.bottom,
    }
}

class Container {

    // Create a new aligned container for the given elements.
    constructor(parent) {

        // Prepare parent
        parent.style.margin = "0";

        // Set member variables
        this.parent = parent;
        this.elements = [];
        this.alignment = Alignment.NONE;

        // Perform initial render.
        this.render();
    }

    add(direction, element) {
        
        // Prepare element
        element.style.display = "block";
        element.style.position = "absolute";
        element.style.top = "0px";
        element.style.left = "0px";
        element.style.width = "0px";
        element.style.height = "0px";

        // Iff there are elements, check alignment.
        if (this.elements.length > 0) {

            // Compute target alignment.
            var target_alignment;
            switch (direction) {
                case Direction.LEFT:
                case Direction.RIGHT:
                    target_alignment = Alignment.HORIZONTAL;
                    break;
                case Direction.TOP:
                case Direction.BOTTOM:
                    target_alignment = Alignment.VERTICAL;
                    break;
            }

            // Fix alignment iff mismatched.
            if (this.alignment != target_alignment) {
                
                // Create wrapper.
                const wrapper = document.createElement("div");
                wrapper.style.display = "block";
                wrapper.style.position = "absolute";
                wrapper.style.top = "0px";
                wrapper.style.left = "0px";
                wrapper.style.width = "0px";
                wrapper.style.height = "0px";

                // Create sub-container.
                const sub_container = new Container(wrapper);

                // Move elements from this container to the subcontainer.
                sub_container.elements = this.elements;
                sub_container.alignment = this.alignment;

                for (const element of this.elements) {
                    
                    var target = element;
                    if (element instanceof Container) {
                        target = element.parent;
                    }

                    this.parent.removeChild(target);
                    wrapper.appendChild(target);
                }

                // Reconfigure this container.
                this.parent.appendChild(wrapper);
                this.elements = [sub_container];
                this.alignment = target_alignment;
            }
        }

        // Add element.
        this.parent.appendChild(element);
        switch (direction) {
            case Direction.LEFT:
            case Direction.TOP:
            this.elements.unshift(element);
                break;
            case Direction.RIGHT:
            case Direction.BOTTOM:
            this.elements.push(element);
                break;
        }

        // Reposition and resize elements.
        this.render();
    }

    // Reposition and resize elements based on alignment.
    render() {

        const dimensions = get_dimensions(this.parent);
        var width = dimensions.width;
        var height = dimensions.height;

        const count = this.elements.length;
        if (count > 1) {
            switch (this.alignment) {
                case Alignment.HORIZONTAL:
                    width = width / count;
                    break;
                case Alignment.VERTICAL:
                    height = height / count;
                    break;
                default:
                    console.error("Invalid alignment \"" + this.alignment + "\" for container with " + count + " elements.");
            }
        }

        var top = 0;
        var left = 0;
        for (const element of this.elements) {

            var target = element;
            if (element instanceof Container) {
                target = element.parent;
            }

            target.style.width = width + "px";
            target.style.height = height + "px";
            target.style.top = top + "px";
            target.style.left = left + "px";

            if (element instanceof Container) {
                element.render();
            }

            switch (this.alignment) {
                case Alignment.HORIZONTAL:
                    left += width;
                    break;
                case Alignment.VERTICAL:
                    top += height;
                    break;
            }
        }
    }
}

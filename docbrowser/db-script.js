/*
DocBrowser - http://www.toptensoftware.com/docbrowser
Copyright (C) 2019 Topten Software. All Rights Reserved

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this product except in 
compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is 
distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
See the License for the specific language governing permissions and limitations under the License.
*/


document.addEventListener('DOMContentLoaded', function(event) {

    // Get the nav tree root
    var navTree = document.getElementById("nav-tree");
    var navPanel = document.getElementById("nav-primary");

    // Load the old view state
    var viewState;
    if (navTree.dataset.key) {
        try {
            viewState = JSON.parse(sessionStorage.getItem(navTree.dataset.key));
        }
        catch (e) {
            // MS Edge doesn't support sessionStorage on local files.  Scroll position
            // and state of nav tree wont be persisted across page transitions.
        }
    }

    if (!viewState)
        viewState = {};

    // Save view state on unload
    window.addEventListener("beforeunload", function(ev) 
    {
        if (navTree.dataset.key)
        {
            viewState.tocScrollPos = navPanel.scrollTop;
            viewState.tocState = getExpandedNodes();
            sessionStorage.setItem(navTree.dataset.key, JSON.stringify(viewState));
        }
    });

    // Add expander class to all divs in the navTree
    if (navTree.dataset.autoexpanders != undefined)
    {
        var divs = navTree.querySelectorAll("div");
        for (var i=0; i<divs.length; i++)
        {
            if (divs[i].parentElement != navTree)
            {
                divs[i].classList.add("expander");
            }
        }
    }

    // Hook up event handlers for all expander labels
    var expanders = navTree.querySelectorAll("div.expander > label");
    for (var i=0; i<expanders.length; i++)
    {
        var span = document.createElement('span');
        span.classList.add("chevron");
        expanders[i].insertBefore(span, expanders[i].childNodes[0]);
        expanders[i].addEventListener('click', expanderClicked);

        // Make sure all expander divs have an id
        var divEl = expanders[i].parentNode;
        if (!divEl.id)
            divEl.id = id_for_expander(divEl);
    }

    // Handler for click on expander
    function expanderClicked(ev)
    {
        if (!navTree.classList.contains("filterActive"))
        {
            ev.target.parentElement.classList.toggle("expanded");
        }
    }

    // Get an array of id's for all expanded nodes
    function getExpandedNodes()
    {
        var list = [];
        var nodes = navTree.querySelectorAll("div.expander.expanded");
        for (var i=0; i<nodes.length; i++)
            list.push(nodes[i].id);
        return list;
    }

    // Restore the set of expanded nodes from an array of ids
    function setExpandedNodes(nodeIds)
    {
        // Collapse old expanded nodes
        var divs = navTree.querySelectorAll("div.expander.expanded");
        for (var i=0; i<divs.length; i++)
            divs[i].classList.remove("expanded");

        // Expand new expanded nodes
        for (var i=0; i<nodeIds.length; i++)
        {
            var el = document.getElementById(nodeIds[i]);
            if (el)
            {
                el.classList.add("expanded");
            }
        }
    }

    // Convert an innerHTML string to something that is a valid HTML id
    function id_safe_string(inStr)
    {
        var outStr = "";
        for (var i=0; i<inStr.length; i++)
        {
            var ch = inStr[i];
            if ((ch>='A' && ch <='Z') 
                    || (ch>='a' && ch<='z') 
                    || (ch>='0' && ch<='9') 
                    || (ch == '-') 
                    || ch == '_' 
                    || ch == ':' 
                    || ch == '.')
            {
                outStr += ch;
            }
            else if (ch==' ')
                outStr += '_'
        }
        return outStr;
    }

    // Create a unique id for an expander element 
    function id_for_expander(el)
    {
        // Reached the root?
        if (el == navTree)
            return "nav";

        // Get parent id
        var parentId = id_for_expander(el.parentElement);

        // Is this isn't an expander, just return the outer id
        if (!el.classList.contains("expander"))
            return parentId;

        // Get it's label and use the contained text as the 
        // basis for the label
        var label = el.querySelector("label");
        var idPart;
        if (label.parentNode == el)
        {
            idPart = id_safe_string(label.innerText);
        }
        if (!idPart)
        {
            // Fallback, couldn't find a text label for the expander, use
            // index of the item in the parent list instead
            var siblings = el.parentElement.childNodes;
            for (var i=0; i<siblings.length; i++)
            {
                if (siblings[i] == el)
                {
                    idPart = "" + i;
                    break;
                }
            }
        }
        return parentId + "-" + idPart;
    }

    // Show the nav tree now that we're about to configure it
    // (Need to show before setting scroll position and won't flicker
    // since the next repaint cycle won't happen till script is finished)
    document.getElementById("nav-content").classList.remove("hidden");

    // Restore the table of contents view state
    var autoExpandSelectedNode = true;
    if (viewState.tocState)
    {
        setExpandedNodes(viewState.tocState);
        autoExpandSelectedNode = false;
    }

    // Pending scroll position for the nav bar that should be applied
    // when it's first show
    var _pendingNavScroll;

    // Restore scroll position
    if (viewState.tocScrollPos)
    {
        // If the nav panel is hidden, then delay applying the 
        // initial scroll position until it's shown for the first time
        if (window.getComputedStyle(navPanel, "").display == "none")
        {
            _pendingNavScroll = viewState.tocScrollPos;
        }

        navPanel.scrollTop = viewState.tocScrollPos;    
        autoExpandSelectedNode = false;    
    }

    // Highlight the nav link that refers to this page
    var links = navTree.querySelectorAll("a");
    for (var i=0; i<links.length; i++)
    {
        // This page?
        var hrefHere = window.location.origin + window.location.pathname;
        if (links[i].href == hrefHere)
        {
            // Walk parent chain...
            var el = links[i].parentElement;

            // Add active attribute to immediate parent (it should be a list item)
            if (el.matches("li"))
                el.classList.add("active");

            // Expand all outer expanders
            if (autoExpandSelectedNode)
            {
                while (el != null && el != navTree)
                {
                    if (el.matches("div.expander"))
                        el.classList.add("expanded");
                    el = el.parentElement;
                }

                // Scroll it visible
                links[i].scrollIntoView({ block: "nearest" });
            }
            break;
        }
    }

    // Add listener for typing in the filter text box
    var filterBox = document.querySelector("#nav-filter");
    filterBox.addEventListener('input', function (ev) {
        doFilter(ev.target.value);
    });

    // If there's text in the filter box (eg: after back button)
    // the filter the nav immediately
    if (filterBox.value.length > 0)
        doFilter(filterBox.value);

    // Update the nav bar to be filtered by `filterText`
    function doFilter(filterText)
    {
        // Case insensitive
        filterText = filterText.toLowerCase();

        // Get the filter root and toggle the filterActive class
        navTree.classList.toggle("filterActive", filterText.length > 0);

        // Clear match styles from previous filter
        var oldMatches = navTree.querySelectorAll(".match");
        for (var i=0; i<oldMatches.length; i++)
        {
            oldMatches[i].classList.remove("match");
        }

        // Filter canceled?
        if (filterText.length == 0)
            return;

        // Find all filterable nodes
        var filterNodes = navTree.querySelectorAll("li");
        for (var i=0; i<filterNodes.length; i++)
        {
            // Find the <a> tag to check for match
            var elFilter = filterNodes[i].querySelector("a");

            // Work out the text to match on
            var txtValue = elFilter.dataset.filterText;
            if (txtValue === undefined)
                txtValue = (elFilter.innerText);

            // Does it match
            if (txtValue.toLowerCase().indexOf(filterText) >= 0)
            {
                var el = elFilter;
                while (el != navTree)
                {
                    // Quit if already handled by previous match
                    if (el.classList.contains("match"))
                        break;

                    // Tag this element as a match
                    el.classList.add("match");

                    // Also show headings for this sections
                    showPriorSiblingHeading(el);

                    // Move to the parent element
                    el = el.parentElement;
                }
            }
        }
    }

    // Helper for ensuring the preceeding heading elements in a matching filter
    // result are also shown
    function showPriorSiblingHeading(el)
    {
        while (el != null)
        {
            // Is it a heading?
            if (el.tagName == "LABEL" && el.parentElement.parentElement == navTree)   
            {
                el.classList.add("match");
                return;
            }

            // Keep a lookin'
            el = el.previousElementSibling;

            // Early abort?
            if (el && el.classList.contains('match'))
                return;
        }
    }

    // Populate the "On this page" side bar
    var headings = document.querySelectorAll("article h1, article h2, article h3");
    var headingLinks = [];
    var navSecondary = document.getElementById("nav-secondary");
    var anyPageLinks = false;
    if (navSecondary)
    {
        // Create a link to each heading section in the document
        for (var i=0; i<headings.length; i++)
        {
            var sectId = headings[i].id;
            if (!sectId)
                continue;

            anyPageLinks = true;

            // Create a an anchor element and link it to the heading
            // (giving the heading an id if it doesn't already have one)
            var el = document.createElement("a");
            el.setAttribute("href", "#" + sectId);

            // Work out the link text
            var linkText = headings[i].dataset.navSecondaryText;
            if (!linkText)
                linkText = headings[i].innerText;
            el.innerText = linkText;

            // Hook up a link handler for the anchor
            el.addEventListener("click", setSecondaryNavHighlightDelayed(i));

            // Add to collection and to the side bar
            headingLinks.push(el);
            navSecondary.appendChild(el);
        }

        if (!anyPageLinks)
        {
            // No links, hide it 
            navSecondary.classList.add("hidden");
        }
        else
        {
            // Highlight the links in the the side bar as the page is scrolled
            document.addEventListener("scroll", updateSecondaryNavHighlight);
            updateSecondaryNavHighlight();
        }

    }

    // For all headings that have an id, automatically add a link icon
    // at the end of the heading
    for (var i=0; i<headings.length; i++)
    {
        if (headings[i].id)
        {
            // Create an anchor link after the heading name
            var el = document.createElement("a");
            el.setAttribute("href", "#" + headings[i].id);
            el.classList.add("anchor-link");
            el.innerHTML = "<i class=\"icon-link\" aria-hidden=\"true\"></i>";
            headings[i].appendChild(el);
        }
    }

    var inPendingHighlight = false;

    // This function is called when clicking on a link in the "on this page" sidebar
    // It's only purpose is to highlight that element, but because the link might
    // cause the document to scroll, we need to delay a little bit (so the scroll
    // can finish).  To reduce flicker we ignore scrolling while the delay is pending.
    function setSecondaryNavHighlightDelayed(section)
    {
        return function()
        {
            inPendingHighlight = true;      // Ignore scrolling until we're done.
            window.setTimeout(function() { 
                inPendingHighlight = false;
                setSecondaryNavHighlight(section); 
            }, 50);
        };
    }

    // Highlight a particular heading in the "on this page" sidebar
    function setSecondaryNavHighlight(section)
    {
        // Ignore scrolling while pending highlight in progress
        if (inPendingHighlight)
            return;

        if (section >= headingLinks.length)
            return;

        // Only change the classes if we really need to
        if (!headingLinks[section].classList.contains("selected"))
        {
            // Update classes
            for (var j=0; j<headingLinks.length; j++)
            {
                headingLinks[j].classList.toggle("selected", j == section);
            }
        }
    }

    // Update which element in the this page toc is currently selected
    // This is called on scroll, so make it quick as possible
    function updateSecondaryNavHighlight()
    {
        setSecondaryNavHighlight(getVisibleHeading());
    }

    // Work out which heading is the first visible and the previous section
    // will be the currently visible section
    function getVisibleHeading() 
    {
        var scrollPos = window.scrollY;
        for (var i=1; i<headings.length; i++)
        {
            if (headings[i].offsetTop  > scrollPos + 50)
                return i-1;
        }

        // Must be the last section
        return i-1;
    }

    // Hook up the show nav button
    document.getElementById("show-nav-button").addEventListener("click", function(ev) {

        // Show the nav popup
        document.body.classList.toggle("nav-popup-active");

        // If the nav popup was hidden when the page was loaded then we
        // still need to apply the initial scroll position
        if (_pendingNavScroll)
        {
            navPanel.scrollTop = _pendingNavScroll;    
            _pendingNavScroll = null;            
        }

        return true;
    });

});

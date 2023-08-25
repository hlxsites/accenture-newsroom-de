/* eslint-disable no-undef */
const createMetadataBlock = (main, document, url) => {
  const meta = {};
  // add the template
  if (url.includes('/news/')) {
    meta.Template = 'Article';
  } else if (url.startsWith('/industry/') || url.startsWith('/subjects/')) {
    meta.Template = 'Category';
  }

  const title = document.head.querySelector('meta[property="og:title"]');
  if (title) {
    meta.Title = title.content;
  } else {
    const titleFromContent = document.head.querySelector('title');
    if (titleFromContent) meta.Title = titleFromContent.innerText;
  }

  const desc = document.head.querySelector('meta[property="og:description"]');
  if (desc) {
    meta.Description = desc.content.replace(/&ndash;/g, '-');
  } else {
    const description = document.head.querySelector('meta[name="description"]');
    if (description) meta.Description = description.content.replace(/&ndash;/g, '-');
  }

  // Published date
  const publishedDate = document.head.querySelector('meta[name="datepublic"]');
  if (publishedDate) meta.PublishedDate = publishedDate.content;

  // Tags metadata
  const industryTagsContainer = document.querySelector('#tek-wrap-rightrail .wrap-industry ul');
  if (industryTagsContainer) {
    const industryTags = [];
    industryTagsContainer.querySelectorAll('li').forEach((li) => {
      industryTags.push(li.textContent.trim());
    });
    meta.Industry = industryTags.join(', ');
  }

  const subjectTagsContainer = document.querySelector('#tek-wrap-rightrail .wrap-subject ul');
  if (subjectTagsContainer) {
    const subjectTags = [];
    subjectTagsContainer.querySelectorAll('li').forEach((li) => {
      subjectTags.push(li.textContent.trim());
    });
    meta.Subject = subjectTags.join(', ');
  }
  // helper to create the metadata block
  const block = WebImporter.Blocks.getMetadataBlock(document, meta);

  // append the block to the main element
  main.append(block);

  // returning the meta object might be usefull to other rules
  return meta;
};

const makeProxySrcs = (main, host = 'https://newsroom.accenture.com') => {
  main.querySelectorAll('img').forEach((img) => {
    if (img.src.startsWith('/')) {
      // make absolute
      const cu = new URL(host);
      img.src = `${cu.origin}${img.src}`.replace(/\/\//g, '/');
    }
    try {
      const u = new URL(img.src);
      u.searchParams.append('host', u.origin);
      img.src = `http://localhost:3001${u.pathname}${u.search}`;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Unable to make proxy src for ${img.src}: ${error.message}`);
    }
  });
};

export default {
  transform: ({
    // eslint-disable-next-line no-unused-vars
    document,
    url,
  }) => {
    // Remove unnecessary parts of the content
    const main = document.body;
    const results = [];

    // Remove other stuff that shows up in the page
    const nav = main.querySelector('#block-header');
    if (nav) nav.remove();
    const hero = main.querySelector('#art-hero');
    if (hero) hero.remove();
    const features = main.querySelector('.f-wrap-features');
    if (features) features.remove();
    const pageType = main.querySelector('#tek-wrap-centerwell .page-type');
    if (pageType) pageType.remove();
    // remove search modal
    const searchModal = main.querySelector('#myModal');
    if (searchModal) searchModal.remove();
    const loginWarning = main.querySelector('#loginwarning');
    if (loginWarning) loginWarning.remove();
    const nonMediaWarning = main.querySelector('#nonmediawarning');
    if (nonMediaWarning) nonMediaWarning.remove();
    const noscripts = main.querySelectorAll('noscript');
    if (noscripts && noscripts.length > 0) {
      noscripts.forEach((noscript) => {
        noscript.remove();
      });
    }

    // Remove Footer
    const footer = main.querySelector('#block-footer');
    if (footer) footer.remove();

    // replace nbsps and ndash
    main.innerHTML = main.innerHTML.replace(/&nbsp;/g, ' ').replace(/&ndash;/g, '-');

    // make proxy srcs for images
    makeProxySrcs(main);

    createMetadataBlock(main, document, url);
    // remove right nav
    const rightNav = main.querySelector('#tek-wrap-rightrail');
    if (rightNav) rightNav.remove();

    // main page import - "element" is provided, i.e. a docx will be created
    results.push({
      element: main,
      path: new URL(url).pathname.replace('.htm', ''),
    });

    return results;
  },
};
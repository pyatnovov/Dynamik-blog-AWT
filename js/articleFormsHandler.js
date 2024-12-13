// js/articleFormsHandler.js
export default class articleFormsHandler {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.HIDDEN_TAG = "travelBlog";
  }

  getCurrentUser() {
    const user = localStorage.getItem("currentUser");
    if (user) {
      return JSON.parse(user);
    }
    return null;
  }

  assignFormForInsert(formId, pageNumber, totalPages) {
    const form = document.getElementById(formId);
    if (!form) {
      console.error(`Форма з id "${formId}" не знайдена.`);
      return;
    }

    const currentUser = this.getCurrentUser();
    if (currentUser) {
      form.author.value = currentUser.fullName;
      form.author.readOnly = true;
    } else {
      form.author.value = "Anonymous";
    }

    form.onsubmit = (evt) => {
      evt.preventDefault();
      const formData = new FormData(form);

      let tags = formData.get("tags") || "";
      tags = this.ensureHiddenTag(tags);

      const articleData = {
        author: currentUser ? currentUser.fullName : formData.get("author"),
        title: formData.get("title"),
        content: formData.get("content"),
        tags: tags,
        imageLink: formData.get("imageLink"),
      };

      this.insertArticle(articleData, pageNumber, totalPages);
    };
  }

  assignFormAndArticle(
    formElementId,
    cssClass2hideElement,
    articleId,
    pageNumber,
    totalPages,
    ifMy = 0
  ) {
    this.cssCl2hideElm = cssClass2hideElement;
    const artForm = document.getElementById(formElementId);
    if (!artForm) {
      console.error(`Форма з id "${formElementId}" не знайдена.`);
      return;
    }
    this.formElements = artForm.elements;
    this.ifMy = ifMy;
    this.pageNumber = pageNumber;
    this.totalPages = totalPages;

    this.formElements.namedItem("btShowFileUpload").onclick = () =>
      this.showFileUpload();
    this.formElements.namedItem("btFileUpload").onclick = () =>
      this.uploadImg();
    this.formElements.namedItem("btCancelFileUpload").onclick = () =>
      this.cancelFileUpload();

    if (articleId >= 0) {
      artForm.onsubmit = (event) => this.processArtEditFrmData(event);
      this.articleId = articleId;
    } else {
      artForm.onsubmit = (event) => this.processArtNewFrmData(event);
    }
  }

  showFileUpload() {
    this.formElements
      .namedItem("fsetFileUpload")
      .classList.remove(this.cssCl2hideElm);
    this.formElements
      .namedItem("btShowFileUpload")
      .classList.add(this.cssCl2hideElm);
  }

  cancelFileUpload() {
    this.formElements
      .namedItem("fsetFileUpload")
      .classList.add(this.cssCl2hideElm);
    this.formElements
      .namedItem("btShowFileUpload")
      .classList.remove(this.cssCl2hideElm);
  }


  uploadImg() {
    const files = this.formElements.namedItem("file").files;
    if (files.length > 0) {
      const imgLinkElement = this.formElements.namedItem("imageLink");
      const fieldsetElement = this.formElements.namedItem("fsetFileUpload");
      const btShowFileUploadElement =
        this.formElements.namedItem("btShowFileUpload");

      let imgData = new FormData();
      imgData.append("file", files[0]);

      fetch(`${this.baseURL}/fileUpload`, {
        method: "POST",
        body: imgData,
      })
        .then((response) => {
          if (response.ok) return response.json();
          return response.text().then((text) => {
            throw new Error(text || `HTTP Error: ${response.status}`);
          });
        })
        .then((responseJSON) => {
          console.log(responseJSON);
          imgLinkElement.value = responseJSON.fullFileUrl;
          btShowFileUploadElement.classList.remove(this.cssCl2hideElm);
          fieldsetElement.classList.add(this.cssCl2hideElm);
        })
        .catch((error) => {
          window.alert(`Image upload failed. ${error.message}`);
        });
    } else {
      window.alert("Please select an image file.");
    }
  }

  ensureHiddenTag(tagsString) {
    const tagsArray = tagsString
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (!tagsArray.includes(this.HIDDEN_TAG)) {
      tagsArray.push(this.HIDDEN_TAG);
    }
    return tagsArray;
  }

  processArtEditFrmData(event) {
    event.preventDefault();

    const articleData = {
      title: this.formElements.namedItem("title").value.trim(),
      content: this.formElements.namedItem("content").value.trim(),
      author: this.formElements.namedItem("author").value.trim(),
      imageLink: this.formElements.namedItem("imageLink").value.trim(),
      tags: this.formElements.namedItem("tags").value.trim(),
    };

    if (!(articleData.title && articleData.content)) {
      window.alert("Please provide title and content.");
      return;
    }

    if (!articleData.author) {
      articleData.author = "Anonymous";
    }

    if (!articleData.imageLink) {
      delete articleData.imageLink;
    }

    if (!articleData.tags) {
      delete articleData.tags;
    } else {
      articleData.tags = articleData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      if (articleData.tags.length === 0) {
        delete articleData.tags;
      } else {
        if (!articleData.tags.includes(this.HIDDEN_TAG)) {
          articleData.tags.push(this.HIDDEN_TAG);
        }
      }
    }

    const putReqSettings = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify(articleData),
    };

    fetch(`${this.baseURL}/article/${this.articleId}`, putReqSettings)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          return response.text().then((text) => {
            throw new Error(text || `HTTP Error: ${response.status}`);
          });
        }
      })
      .then(() => {
        window.alert("Article successfully updated.");
        window.location.hash = `#article/${this.articleId}/${this.pageNumber}/${this.totalPages}`;
      })
      .catch((error) => {
        window.alert(`Failed to save changes. ${error.message}`);
      });
  }

  processArtNewFrmData(event) {
    event.preventDefault();

    const articleData = {
      title: this.formElements.namedItem("title").value.trim(),
      content: this.formElements.namedItem("content").value.trim(),
      author: this.formElements.namedItem("author").value.trim(),
      imageLink: this.formElements.namedItem("imageLink").value.trim(),
      tags: this.formElements.namedItem("tags").value.trim(),
    };

    if (!(articleData.title && articleData.content)) {
      window.alert("Please provide title and content.");
      return;
    }

    if (!articleData.author) {
      articleData.author = "Anonymous";
    }

    if (!articleData.imageLink) {
      delete articleData.imageLink;
    }

    if (!articleData.tags) {
      articleData.tags = [];
    } else {
      articleData.tags = articleData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
    }

    if (!articleData.tags.includes(this.HIDDEN_TAG)) {
      articleData.tags.push(this.HIDDEN_TAG);
    }

    const postReqSettings = {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify(articleData),
    };

    fetch(`${this.baseURL}/article`, postReqSettings)
      .then((response) => {
        if (response.ok || response.status === 201) {
          return response.json();
        } else {
          return response.text().then((text) => {
            throw new Error(text || `HTTP Error: ${response.status}`);
          });
        }
      })
      .then((responseJSON) => {
        window.alert("Article successfully added.");
        const newArticleId = responseJSON.id;
        window.location.hash = `#article/${newArticleId}/${this.pageNumber}/${this.totalPages}`;
      })
      .catch((error) => {
        window.alert(`Failed to add article. ${error.message}`);
      });
  }

  saveArticle(artId, articleData, pageNumber, totalPages) {
    const url = `${this.baseURL}/article/${artId}`;

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 204) {
        alert("Changes saved!");
        window.location.hash = `#article/${artId}/${pageNumber}/${totalPages}`;
      } else {
        alert(
          "Error saving changes: " +
            (xhr.responseText || `HTTP Error: ${xhr.status}`)
        );
      }
    };
    xhr.onerror = () => {
      alert("Network error saving changes.");
    };
    xhr.send(JSON.stringify(articleData));
  }

  insertArticle(articleData, pageNumber, totalPages) {
    const url = `${this.baseURL}/article`;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onload = () => {
      if (xhr.status === 201 || xhr.status === 200 || xhr.status === 204) {
        alert("New article successfully added!");
        const response = JSON.parse(xhr.responseText);
        const newArticleId = response.id;
        window.location.hash = `#article/${newArticleId}/${pageNumber}/${totalPages}`;
      } else {
        alert(
          "Error adding article: " +
            (xhr.responseText || `HTTP Error: ${xhr.status}`)
        );
      }
    };
    xhr.onerror = () => {
      alert("Network error adding the article.");
    };
    xhr.send(JSON.stringify(articleData));
  }
}

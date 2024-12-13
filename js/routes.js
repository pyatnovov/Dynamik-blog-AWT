// routes.js
import Mustache from "./mustache.js";
import processOpnFrmData from "./addOpinion.js";
import articleFormsHandler from "./articleFormsHandler.js";

const urlBase = "https://wt.kpi.fei.tuke.sk/api";
const articlesPerPage = 20;
const commentsPerPage = 10;
const HIDDEN_TAG = "travelBlog";

if (!window.artFrmHandler) {
  window.artFrmHandler = new articleFormsHandler(urlBase);
}

export default [
  {
    hash: "welcome",
    target: "router-view",
    getTemplate: (targetElm) => {
      const welcomeTemplate =
        document.getElementById("template-welcome").innerHTML;
      document.getElementById(targetElm).innerHTML = welcomeTemplate;
    },
  },
  {
    hash: "articles",
    target: "router-view",
    getTemplate: fetchAndDisplayArticles,
  },
  {
    hash: "article",
    target: "router-view",
    getTemplate: (
      targetElm,
      artIdFromHash,
      pageNumberFromHash,
      totalPagesFromHash,
      commentPageFromHash
    ) => {
      fetchAndDisplayArticleDetail(
        targetElm,
        artIdFromHash,
        pageNumberFromHash,
        totalPagesFromHash,
        commentPageFromHash
      );
    },
  },
  {
    hash: "myArticles",
    target: "router-view",
    getTemplate: (targetElm, pageNumberFromHash, totalPagesFromHash) => {
      fetchAndDisplayMyArticles(
        targetElm,
        pageNumberFromHash,
        totalPagesFromHash
      );
    },
  },
  {
    hash: "opinions",
    target: "router-view",
    getTemplate: createHtml4opinions,
  },
  {
    hash: "addOpinion",
    target: "router-view",
    getTemplate: (targetElm) => {
      document.getElementById(targetElm).innerHTML = document.getElementById(
        "template-addOpinion"
      ).innerHTML;
      document.getElementById("feedback-form").onsubmit = processOpnFrmData;

      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (currentUser) {
        const opNameInput = document.getElementById("name");
        if (opNameInput) {
          opNameInput.value = currentUser.fullName;
          opNameInput.readOnly = true;
        }
      }
    },
  },

  {
    hash: "signIn",
    target: "router-view",
    getTemplate: (targetElm) => {
      const signInTemplate =
        document.getElementById("template-signIn").innerHTML;
      document.getElementById(targetElm).innerHTML = signInTemplate;
    },
  },
  {
    hash: "signUp",
    target: "router-view",
    getTemplate: (targetElm) => {
      const signUpTemplate =
        document.getElementById("template-signUp").innerHTML;
      document.getElementById(targetElm).innerHTML = signUpTemplate;
    },
  },
  {
    hash: "artEdit",
    target: "router-view",
    getTemplate: (
      targetElm,
      artIdFromHash,
      pageNumberFromHash,
      totalPagesFromHash
    ) => {
      editArticle(
        targetElm,
        artIdFromHash,
        pageNumberFromHash,
        totalPagesFromHash
      );
    },
  },
  {
    hash: "artDelete",
    target: "router-view",
    getTemplate: (
      targetElm,
      artIdFromHash,
      pageNumberFromHash,
      totalPagesFromHash
    ) => {
      deleteArticle(
        targetElm,
        artIdFromHash,
        pageNumberFromHash,
        totalPagesFromHash
      );
    },
  },
  {
    hash: "artInsert",
    target: "router-view",
    getTemplate: (targetElm, pageNumberFromHash, totalPagesFromHash) => {
      insertArticle(targetElm, pageNumberFromHash, totalPagesFromHash);
    },
  },
];

function insertArticle(targetElm, pageNumberFromHash, totalPagesFromHash) {
  const pageNumber = parseInt(pageNumberFromHash) || 1;
  const totalPages = parseInt(totalPagesFromHash) || 1;

  const backLink = `#articles/${pageNumber}/${totalPages}`;

  const data = {
    formTitle: "Add New Article",
    submitBtTitle: "Add Article",
    author: "",
    title: "",
    imageLink: "",
    content: "",
    tags: "",
    backLink: backLink,
  };

  const articleFormTemplate = document.getElementById(
    "template-article-form"
  ).innerHTML;
  const rendered = Mustache.render(articleFormTemplate, data);
  document.getElementById(targetElm).innerHTML = rendered;

  window.artFrmHandler.assignFormForInsert(
    "articleForm",
    pageNumber,
    totalPages
  );
}

function deleteArticle(
  targetElm,
  artIdFromHash,
  pageNumberFromHash,
  totalPagesFromHash
) {
  const articleId = artIdFromHash;
  const pageNumber = parseInt(pageNumberFromHash);
  const totalPages = parseInt(totalPagesFromHash);

  const url = `${urlBase}/article/${articleId}`;

  const ajax = new XMLHttpRequest();
  ajax.open("DELETE", url, true);

  ajax.onload = function () {
    if (this.status === 200 || this.status === 204) {
      alert("Article successfully deleted!");
      window.location.hash = `#articles/${pageNumber}/${totalPages}`;
    } else {
      const errMsgObj = { errMessage: this.responseText };
      const errorTemplate = document.getElementById(
        "template-articles-error"
      ).innerHTML;
      const rendered = Mustache.render(errorTemplate, errMsgObj);
      document.getElementById(targetElm).innerHTML = rendered;
    }
  };

  ajax.onerror = function () {
    alert("Network error while deleting the article.");
  };

  ajax.send();
}

function editArticle(
  targetElm,
  artIdFromHash,
  pageNumberFromHash,
  totalPagesFromHash
) {
  fetchAndProcessArticle(
    targetElm,
    artIdFromHash,
    pageNumberFromHash,
    totalPagesFromHash,
    true
  );
}

function addArtDetailLink2ResponseJson(responseData, pageNumber, totalPages) {
  responseData.articles = responseData.articles.map((article) => ({
    ...article,
    detailLink: `#article/${article.id}/${pageNumber}/${totalPages}/1`,
  }));
}

function fetchAndDisplayArticleDetail(
  targetElm,
  artIdFromHash,
  pageNumberFromHash,
  totalPagesFromHash,
  commentPageFromHash
) {
  const pageNumber = parseInt(pageNumberFromHash);
  const totalPages = parseInt(totalPagesFromHash);
  const commentPage = commentPageFromHash ? parseInt(commentPageFromHash) : 1;
  fetchAndProcessArticle(
    targetElm,
    artIdFromHash,
    pageNumber,
    totalPages,
    false,
    commentPage
  );
}

function fetchAndProcessArticle(
  targetElm,
  artIdFromHash,
  pageNumber,
  totalPages,
  forEdit,
  commentPage = 1
) {
  const url = `${urlBase}/article/${artIdFromHash}`;
  const ajax = new XMLHttpRequest();
  ajax.open("GET", url, true);

  ajax.onload = function () {
    if (this.status === 200) {
      const responseJSON = JSON.parse(this.responseText);

      if (forEdit) {
        responseJSON.formTitle = "Article Edit";
        responseJSON.submitBtTitle = "Save Article";
        responseJSON.backLink = `#article/${artIdFromHash}/${pageNumber}/${totalPages}/1`;

        const articleFormTemplate = document.getElementById(
          "template-article-form"
        ).innerHTML;
        const rendered = Mustache.render(articleFormTemplate, responseJSON);
        document.getElementById(targetElm).innerHTML = rendered;

        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (currentUser) {
          const authorInput = document.getElementById("author");
          if (authorInput) {
            authorInput.value = currentUser.fullName;
            authorInput.readOnly = true;
          }
        }

        window.artFrmHandler.assignFormAndArticle(
          "articleForm",
          "hiddenElm",
          artIdFromHash,
          pageNumber,
          totalPages
        );
      } else {
        responseJSON.backLink = `#articles/${pageNumber}/${totalPages}`;
        responseJSON.editLink = `#artEdit/${responseJSON.id}/${pageNumber}/${totalPages}`;
        responseJSON.deleteLink = `#artDelete/${responseJSON.id}/${pageNumber}/${totalPages}`;

        const partials = {
          commentForm: document.getElementById("template-comment-form")
            .innerHTML,
        };

        fetchComments(artIdFromHash, commentPage, (err, commentsData) => {
          if (err) {
            console.error(err);
            window.alert("Failed to load comments.");
            return;
          }

          const finalData = {
            ...responseJSON,
            ...commentsData,
            backLink: `#articles/${pageNumber}/${totalPages}`,
            editLink: `#artEdit/${responseJSON.id}/${pageNumber}/${totalPages}`,
            deleteLink: `#artDelete/${responseJSON.id}/${pageNumber}/${totalPages}`,
            id: responseJSON.id,
            pageNumber: pageNumber,
            totalPages: totalPages,
          };

          const storedUser = localStorage.getItem("currentUser");
          const currentUser = storedUser ? JSON.parse(storedUser) : null;

          if (currentUser && currentUser.email === responseJSON.author) {
            finalData.canEdit = true;
            finalData.canDelete = true;
          } else {
            finalData.canEdit = false;
            finalData.canDelete = false;
          }

          if (finalData.tags && finalData.tags.length > 0) {
            finalData.userTags = finalData.tags
              .filter((t) => t !== HIDDEN_TAG)
              .join(", ");
          } else {
            finalData.userTags = "";
          }

          const articleTemplate =
            document.getElementById("template-article").innerHTML;
          const renderedHtml = Mustache.render(
            articleTemplate,
            finalData,
            partials
          );
          document.getElementById(targetElm).innerHTML = renderedHtml;

          addCommentHandlers(
            artIdFromHash,
            pageNumber,
            totalPages,
            finalData,
            targetElm,
            partials
          );
        });
      }
    } else {
      const errMsgObj = { errMessage: this.responseText };
      const errorTemplate = document.getElementById(
        "template-articles-error"
      ).innerHTML;
      const rendered = Mustache.render(errorTemplate, errMsgObj);
      document.getElementById(targetElm).innerHTML = rendered;
    }
  };

  ajax.onerror = function () {
    const errMsgObj = {
      errMessage: "Network error while retrieving the article.",
    };
    const errorTemplate = document.getElementById(
      "template-articles-error"
    ).innerHTML;
    const rendered = Mustache.render(errorTemplate, errMsgObj);
    document.getElementById(targetElm).innerHTML = rendered;
  };

  ajax.send();
}

function fetchComments(artId, commentPage, callback) {
  const maxComments = commentsPerPage + 1;
  const offset = (commentPage - 1) * commentsPerPage;
  const url = `${urlBase}/article/${artId}/comment?max=${maxComments}&offset=${offset}`;
  const xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);

  xhr.onload = function () {
    if (xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      let comments = response.comments.map((c) => ({
        author: c.author,
        text: c.text,
      }));

      let hasNextComments = false;
      if (comments.length > commentsPerPage) {
        hasNextComments = true;
        comments.pop();
      }

      callback(null, {
        comments: comments,
        commentPage: commentPage,
        commentTotalPages: hasNextComments ? commentPage + 1 : commentPage,
        hasPrevComments: commentPage > 1,
        hasNextComments: hasNextComments,
        prevCommentPage: commentPage - 1,
        nextCommentPage: hasNextComments ? commentPage + 1 : null,
      });
    } else {
      callback("Error fetching comments", null);
    }
  };

  xhr.onerror = function () {
    callback("Network error fetching comments", null);
  };

  xhr.send();
}

function addComment(artId, author, text, callback) {
  const url = `${urlBase}/article/${artId}/comment`;
  const data = { author: author, text: text };

  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

  xhr.onload = function () {
    if (xhr.status === 201 || xhr.status === 200) {
      callback(null);
    } else {
      callback("Error adding comment");
    }
  };

  xhr.onerror = function () {
    callback("Network error");
  };

  xhr.send(JSON.stringify(data));
}

function fetchAndDisplayArticles(
  targetElm,
  pageNumberFromHash,
  totalPagesFromHash
) {
  let pageNumber = parseInt(pageNumberFromHash);
  if (isNaN(pageNumber) || pageNumber < 1) {
    pageNumber = 1;
  }

  const offset = (pageNumber - 1) * articlesPerPage;
  const url = `${urlBase}/article?offset=${offset}&max=${articlesPerPage}`;

  const ajax = new XMLHttpRequest();
  ajax.open("GET", url, true);

  ajax.onload = function () {
    if (this.status === 200) {
      const responseData = JSON.parse(this.responseText);

      let totalArticles =
        responseData.meta && responseData.meta.totalCount
          ? parseInt(responseData.meta.totalCount)
          : (pageNumber - 1) * articlesPerPage + responseData.articles.length;

      const totalPages = Math.ceil(totalArticles / articlesPerPage);

      if (!totalPagesFromHash || parseInt(totalPagesFromHash) !== totalPages) {
        window.location.hash = `#articles/${pageNumber}/${totalPages}`;
        return;
      }

      addArtDetailLink2ResponseJson(
        { articles: responseData.articles },
        pageNumber,
        totalPages
      );

      const dataForRender = {
        articles: responseData.articles,
        currPage: pageNumber,
        pageCount: totalPages,
        prevPage: pageNumber > 1 ? pageNumber - 1 : null,
        nextPage: pageNumber < totalPages ? pageNumber + 1 : null,
      };

      const articlesTemplate =
        document.getElementById("template-articles").innerHTML;
      const rendered = Mustache.render(articlesTemplate, dataForRender);
      document.getElementById(targetElm).innerHTML = rendered;
    } else {
      alert("Error: " + this.statusText);
    }
  };

  ajax.onerror = function () {
    alert("Network error while retrieving articles.");
  };

  ajax.send();
}

function fetchAndDisplayMyArticles(targetElm) {
  const url = `${urlBase}/article?tag=travelBlog`;

  const ajax = new XMLHttpRequest();
  ajax.open("GET", url, true);

  ajax.onload = function () {
    if (this.status === 200) {
      const responseData = JSON.parse(this.responseText);

      const filteredArticles = responseData.articles
        .filter((article) => article.tags.includes("travelBlog"))
        .map((article) => ({
          ...article,
          detailLink: `#article/${article.id}/1/1/1`,
        }));

      const dataForRender = {
        articles: filteredArticles, 
      };

      const articlesTemplate = document.getElementById(
        "template-my-articles"
      ).innerHTML;
      const rendered = Mustache.render(articlesTemplate, dataForRender);
      document.getElementById(targetElm).innerHTML = rendered;
    } else {
      alert("Error: " + this.statusText);
    }
  };

  ajax.onerror = function () {
    alert("Network error while retrieving articles.");
  };

  ajax.send();
}


function createHtml4opinions(targetElm) {
  const opinionsFromStorage = localStorage.feedback;
  let opinions = [];

  if (opinionsFromStorage) {
    opinions = JSON.parse(opinionsFromStorage);
    opinions.forEach((opinion) => {
      opinion.created = new Date(opinion.created).toDateString();
    });
  }

  const opinionsData = { opinions };
  document.getElementById(targetElm).innerHTML = Mustache.render(
    document.getElementById("template-opinions").innerHTML,
    opinionsData
  );
}


function addCommentHandlers(
  artIdFromHash,
  pageNumber,
  totalPages,
  responseJSON,
  targetElm,
  partials
) {
  const btAddComment = document.getElementById("btAddComment");
  const addCommentForm = document.getElementById("addCommentForm");
  const commentForm = document.getElementById("commentForm");
  const cancelComment = document.getElementById("cancelComment");

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (currentUser) {
    const cAuthorInput = document.getElementById("commentAuthor");
    if (cAuthorInput) {
      cAuthorInput.value = currentUser.fullName;
      cAuthorInput.readOnly = true;
    }
  }

  if (btAddComment && addCommentForm && commentForm && cancelComment) {
    btAddComment.addEventListener("click", () => {
      addCommentForm.classList.toggle("hiddenElm");
    });

    cancelComment.addEventListener("click", () => {
      addCommentForm.classList.add("hiddenElm");
    });

    commentForm.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(commentForm);
      const text = fd.get("commentText");
      let commentAuthor = fd.get("commentAuthor");

      if (!commentAuthor || commentAuthor.trim() === "") {
        commentAuthor = "Anonymous";
      }

      addComment(artIdFromHash, commentAuthor, text, (err) => {
        if (err) {
          alert("Error adding comment");
          return;
        }
        alert("Comment added!");
        addCommentForm.classList.add("hiddenElm");
        commentForm.reset();

        const currentCommentPage = responseJSON.commentPage || 1;

        fetchComments(
          artIdFromHash,
          currentCommentPage,
          (err, updatedCommentsData) => {
            if (err) {
              console.error(err);
              return;
            }

            const updatedFinalData = {
              ...responseJSON,
              ...updatedCommentsData,
              backLink: `#articles/${pageNumber}/${totalPages}`,
              editLink: `#artEdit/${responseJSON.id}/${pageNumber}/${totalPages}`,
              deleteLink: `#artDelete/${responseJSON.id}/${pageNumber}/${totalPages}`,
              id: responseJSON.id,
              pageNumber: pageNumber,
              totalPages: totalPages,
            };

            const storedUser = localStorage.getItem("currentUser");
            const currentUser = storedUser ? JSON.parse(storedUser) : null;

            if (currentUser && currentUser.email === responseJSON.author) {
              updatedFinalData.canEdit = true;
              updatedFinalData.canDelete = true;
            } else {
              updatedFinalData.canEdit = false;
              updatedFinalData.canDelete = false;
            }

            if (updatedFinalData.tags && updatedFinalData.tags.length > 0) {
              updatedFinalData.userTags = updatedFinalData.tags
                .filter((t) => t !== HIDDEN_TAG)
                .join(", ");
            } else {
              updatedFinalData.userTags = "";
            }

            const articleTemplate =
              document.getElementById("template-article").innerHTML;
            const renderedHtml = Mustache.render(
              articleTemplate,
              updatedFinalData,
              partials
            );
            document.getElementById(targetElm).innerHTML = renderedHtml;

            addCommentHandlers(
              artIdFromHash,
              pageNumber,
              totalPages,
              updatedFinalData,
              targetElm,
              partials
            );
          }
        );
      });
    };
  }
}

